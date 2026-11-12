package health.caresync.patient.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import health.caresync.patient.domain.entity.Tenant;
import health.caresync.patient.domain.repository.TenantRepository;
import health.caresync.patient.dto.FirebaseUserSyncResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class FirebaseUserSyncService {
    private static final Logger LOGGER = LoggerFactory.getLogger(FirebaseUserSyncService.class);
    private static final String UPSERT_SQL = """
        INSERT INTO firebase_users (firebase_uid, email, role, tenant_id, disabled, synced_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          tenant_id = EXCLUDED.tenant_id,
          disabled = EXCLUDED.disabled,
          synced_at = NOW()
        """;

    private final FirebaseAuth firebaseAuth;
    private final TenantRepository tenants;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;
    private final ObjectMapper objectMapper;

    @Autowired
    public FirebaseUserSyncService(
        FirebaseAuth firebaseAuth,
        TenantRepository tenants,
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext,
        ObjectMapper objectMapper
    ) {
        this.firebaseAuth = firebaseAuth;
        this.tenants = tenants;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
        this.objectMapper = objectMapper;
    }

    public FirebaseUserSyncService(
        FirebaseAuth firebaseAuth,
        TenantRepository tenants,
        JdbcTemplate jdbcTemplate,
        String bootstrapAdminEmail,
        String bootstrapAdminTenantSubdomain,
        String superAdminEmail,
        String tenantAdminEmail,
        TenantRlsContext tenantRlsContext
    ) {
        this(firebaseAuth, tenants, jdbcTemplate, tenantRlsContext, new ObjectMapper());
    }

    public FirebaseUserSyncService(
        FirebaseAuth firebaseAuth,
        TenantRepository tenants,
        JdbcTemplate jdbcTemplate,
        String bootstrapAdminEmail,
        String bootstrapAdminTenantSubdomain
    ) {
        this(firebaseAuth, tenants, jdbcTemplate, null, new ObjectMapper());
    }

    @Transactional
    public ProvisionedUser provisionCurrentUser(String uid, String email) throws FirebaseAuthException {
        UserRecord user = firebaseAuth.getUser(uid);
        Map<String, Object> claims = new HashMap<>(user.getCustomClaims());
        UUID tenantId = tenantId(claims.get("tenant_id"), tenants.findAll().stream()
            .map(Tenant::getId).collect(java.util.stream.Collectors.toUnmodifiableSet()));
        String role = stringClaim(claims.get("role"));
        String specialty = stringClaim(claims.get("specialty"));

        boolean platformAdmin = isSuperAdmin(user);
        if (platformAdmin) {
            claims.put("role", "SUPER_ADMIN");
            claims.remove("tenant_id");
            firebaseAuth.setCustomUserClaims(uid, claims);
            tenantId = null;
            role = "SUPER_ADMIN";
        } else if (isTenantAdmin(user)) {
            if (tenantId == null || tenants.findById(tenantId).filter(Tenant::isActive).isEmpty()) {
                throw new IllegalStateException("CareSync tenant is not available for admin provisioning");
            }
            role = "TENANT_ADMIN";
        }

        RegistrationPolicy registrationPolicy = null;
        UUID requestedTenantId = null;
        String normalizedEmail = normalizeEmail(user.getEmail() == null ? email : user.getEmail());
        if (!platformAdmin && (tenantId == null || role == null)) {
            registrationPolicy = loadRegistrationPolicy();
            enforceRegistrationPolicy(registrationPolicy, user, normalizedEmail);
            // Resolve while the trusted platform-policy read context is active.
            // The public user's RLS identity must be restored before any writes.
            requestedTenantId = resolveDefaultTenant(registrationPolicy.defaultTenantId());
        }

        if (tenantRlsContext != null) {
            tenantRlsContext.applyIdentity(new CaresyncPrincipal(uid, tenantId, role, specialty, user.getEmail()));
        } else {
            jdbcTemplate.queryForObject(
                "select set_config('app.firebase_uid', ?, true)",
                String.class,
                uid
            );
            jdbcTemplate.queryForObject(
                "select set_config('app.is_super_admin', ?, true)",
                String.class,
                Boolean.toString(platformAdmin)
            );
        }
        writeBatch(List.of(new SyncUser(uid, normalizedEmail,
            role, tenantId, user.isDisabled())));
        if (!platformAdmin && (tenantId == null || role == null)) {
            jdbcTemplate.update("""
                INSERT INTO registration_requests (email, firebase_uid, requested_role, requested_tenant_id, status)
                VALUES (?, ?, 'PATIENT', ?, 'PENDING')
                ON CONFLICT (firebase_uid) WHERE status = 'PENDING' DO NOTHING
                """,
                normalizedEmail, uid, requestedTenantId
            );
            return new ProvisionedUser(null, null, specialty, "PENDING_APPROVAL");
        }
        return new ProvisionedUser(tenantId, role, specialty, "PROVISIONED");
    }

    public FirebaseUserSyncResponse syncAllUsers() throws FirebaseAuthException {
        Set<UUID> existingTenants = tenants.findAll().stream()
            .map(tenant -> tenant.getId())
            .collect(java.util.stream.Collectors.toUnmodifiableSet());
        int synced = 0;
        int withoutTenant = 0;
        int pages = 0;
        ListUsersPage page = firebaseAuth.listUsers(null);
        while (page != null) {
            List<SyncUser> batch = new ArrayList<>();
            for (var user : page.getValues()) {
                Map<String, Object> claims = new HashMap<>(user.getCustomClaims());
                UUID tenantId = tenantId(claims.get("tenant_id"), existingTenants);
                String role = stringClaim(claims.get("role"));
                if (isSuperAdmin(user)) {
                    if (!"SUPER_ADMIN".equals(role) || claims.containsKey("tenant_id")) {
                        claims.put("role", "SUPER_ADMIN");
                        claims.remove("tenant_id");
                        firebaseAuth.setCustomUserClaims(user.getUid(), claims);
                    }
                    role = "SUPER_ADMIN";
                    tenantId = null;
                } else if (isTenantAdmin(user) && tenantId == null) {
                    // Preserve legacy identity data for review, but never sync an invalid
                    // tenant-admin claim as an active tenant membership.
                    role = null;
                } else if ("ADMIN".equals(role)) {
                    // Preserve the legacy row for the V35 review inventory, but
                    // never reproduce an untrusted legacy role assignment.
                    role = null;
                    tenantId = null;
                }
                if (tenantId == null) {
                    withoutTenant++;
                }
                batch.add(new SyncUser(user.getUid(), user.getEmail(), role, tenantId, user.isDisabled()));
            }
            writeBatch(batch);
            synced += batch.size();
            pages++;
            page = page.getNextPage();
        }
        LOGGER.info("Synced {} Firebase Auth users across {} pages; {} users have no existing tenant mapping",
            synced, pages, withoutTenant);
        return new FirebaseUserSyncResponse(synced, withoutTenant, pages);
    }

    private RegistrationPolicy loadRegistrationPolicy() {
        // Read only the platform policy, then restore RLS to the authenticated
        // identity before writing the request under its self-service policy.
        jdbcTemplate.queryForObject(
            "select set_config('app.is_super_admin', ?, true)", String.class, "true"
        );
        List<String> stored = jdbcTemplate.query(
            "SELECT configuration_value FROM admin_configurations "
                + "WHERE scope = 'PLATFORM' AND tenant_id IS NULL AND configuration_key = 'registration'",
            (resultSet, rowNumber) -> resultSet.getString(1)
        );
        if (stored == null || stored.isEmpty()) return RegistrationPolicy.defaults();
        try {
            JsonNode value = objectMapper.readTree(stored.get(0));
            Set<String> roles = readStringSet(value.path("allowedPublicRoles"), Set.of("PATIENT"));
            Set<String> domains = readStringSet(value.path("allowedEmailDomains"), Set.of()).stream()
                .map(domain -> domain.toLowerCase(Locale.ROOT).replaceFirst("^@", ""))
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
            int maxAttempts = value.path("maxSignupAttemptsPerEmail").canConvertToInt()
                ? Math.max(1, value.path("maxSignupAttemptsPerEmail").asInt()) : 3;
            return new RegistrationPolicy(
                value.path("publicSignupEnabled").asBoolean(true),
                value.path("requireEmailVerification").asBoolean(true),
                roles,
                domains,
                maxAttempts,
                value.path("defaultTenantId").asText("").trim()
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Registration policy is unavailable or invalid", exception);
        }
    }

    private void enforceRegistrationPolicy(RegistrationPolicy policy, UserRecord user, String email) {
        if (!policy.publicSignupEnabled()) {
            throw new health.caresync.common.exception.ForbiddenException("Public registration is disabled");
        }
        if (!policy.allowedPublicRoles().contains("PATIENT")) {
            throw new health.caresync.common.exception.ForbiddenException("Patient registration is not enabled");
        }
        if (policy.requireEmailVerification() && !user.isEmailVerified()) {
            throw new health.caresync.common.exception.ForbiddenException("Verify your email before requesting access");
        }
        if (!policy.allowedEmailDomains().isEmpty()) {
            int separator = email.lastIndexOf('@');
            String domain = separator < 0 ? "" : email.substring(separator + 1).toLowerCase(Locale.ROOT);
            if (!policy.allowedEmailDomains().contains(domain)) {
                throw new health.caresync.common.exception.ForbiddenException("This email domain is not allowed to register");
            }
        }
        Long attempts = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM registration_requests WHERE lower(email) = lower(?)",
            Long.class,
            email
        );
        if (attempts != null && attempts >= policy.maxSignupAttemptsPerEmail()) {
            throw new health.caresync.common.exception.ForbiddenException("The registration attempt limit for this email has been reached");
        }
    }

    private UUID resolveDefaultTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) return null;
        UUID parsed;
        try {
            parsed = UUID.fromString(tenantId);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Configured default registration tenant is invalid", exception);
        }
        Tenant tenant = tenants.findById(parsed)
            .orElseThrow(() -> new IllegalStateException("Configured default registration tenant does not exist"));
        if (!tenant.isActive()) throw new IllegalStateException("Configured default registration tenant is inactive");
        return parsed;
    }

    private static Set<String> readStringSet(JsonNode node, Set<String> fallback) {
        if (!node.isArray()) return fallback;
        LinkedHashSet<String> values = new LinkedHashSet<>();
        node.forEach(item -> {
            if (item.isTextual() && !item.asText().isBlank()) values.add(item.asText().trim().toUpperCase(Locale.ROOT));
        });
        return Set.copyOf(values);
    }

    @Scheduled(
        fixedDelayString = "${caresync.firebase.user-sync-interval-ms:60000}",
        initialDelayString = "${caresync.firebase.user-sync-initial-delay-ms:10000}"
    )
    public void scheduledSync() {
        try {
            syncAllUsers();
        } catch (FirebaseAuthException | RuntimeException exception) {
            LOGGER.error("Scheduled Firebase-to-Postgres user sync failed", exception);
        }
    }

    private void writeBatch(List<SyncUser> users) {
        if (users.isEmpty()) {
            return;
        }
        jdbcTemplate.batchUpdate(UPSERT_SQL, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement statement, int index) throws SQLException {
                SyncUser user = users.get(index);
                statement.setString(1, user.uid());
                statement.setString(2, user.email());
                statement.setString(3, user.role());
                statement.setObject(4, user.tenantId());
                statement.setBoolean(5, user.disabled());
            }

            @Override
            public int getBatchSize() {
                return users.size();
            }
        });
    }

    private static UUID tenantId(Object claim, Set<UUID> existingTenants) {
        if (!(claim instanceof String value) || value.isBlank()) {
            return null;
        }
        try {
            UUID id = UUID.fromString(value);
            return existingTenants.contains(id) ? id : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private boolean isTenantAdmin(UserRecord user) {
        return "TENANT_ADMIN".equals(stringClaim(user.getCustomClaims().get("role")));
    }

    private boolean isSuperAdmin(UserRecord user) {
        return "SUPER_ADMIN".equals(stringClaim(user.getCustomClaims().get("role")));
    }

    private static String stringClaim(Object claim) {
        return claim instanceof String value && !value.isBlank() ? value : null;
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public record ProvisionedUser(UUID tenantId, String role, String specialty, String status) { }
    private record RegistrationPolicy(
        boolean publicSignupEnabled,
        boolean requireEmailVerification,
        Set<String> allowedPublicRoles,
        Set<String> allowedEmailDomains,
        int maxSignupAttemptsPerEmail,
        String defaultTenantId
    ) {
        private static RegistrationPolicy defaults() {
            return new RegistrationPolicy(true, true, Set.of("PATIENT"), Set.of(), 3, "");
        }
    }
    private record SyncUser(String uid, String email, String role, UUID tenantId, boolean disabled) { }
}
