package health.caresync.patient.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import health.caresync.patient.domain.entity.Tenant;
import health.caresync.patient.domain.repository.TenantRepository;
import health.caresync.patient.dto.FirebaseUserSyncResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
    private final Set<String> bootstrapAdminEmails;
    private final Set<String> tenantAdminEmails;
    private final Set<String> superAdminEmails;
    private final String bootstrapAdminTenantSubdomain;
    private final TenantRlsContext tenantRlsContext;

    @Autowired
    public FirebaseUserSyncService(
        FirebaseAuth firebaseAuth,
        TenantRepository tenants,
        JdbcTemplate jdbcTemplate,
        @Value("${caresync.firebase.bootstrap-admin-email:}") String bootstrapAdminEmail,
        @Value("${caresync.firebase.bootstrap-admin-tenant-subdomain:caresync}") String bootstrapAdminTenantSubdomain,
        @Value("${caresync.firebase.super-admin-email:}") String superAdminEmail,
        @Value("${caresync.firebase.tenant-admin-email:}") String tenantAdminEmail,
        TenantRlsContext tenantRlsContext
    ) {
        this.firebaseAuth = firebaseAuth;
        this.tenants = tenants;
        this.jdbcTemplate = jdbcTemplate;
        this.bootstrapAdminEmails = Arrays.stream(bootstrapAdminEmail == null ? new String[0] : bootstrapAdminEmail.split(","))
            .map(FirebaseUserSyncService::normalizeEmail)
            .filter(email -> !email.isBlank())
            .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        this.superAdminEmails = Arrays.stream(superAdminEmail == null ? new String[0] : superAdminEmail.split(","))
            .map(FirebaseUserSyncService::normalizeEmail)
            .filter(email -> !email.isBlank())
            .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        this.tenantAdminEmails = Arrays.stream(tenantAdminEmail == null ? new String[0] : tenantAdminEmail.split(","))
            .map(FirebaseUserSyncService::normalizeEmail)
            .filter(email -> !email.isBlank())
            .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        this.bootstrapAdminTenantSubdomain = bootstrapAdminTenantSubdomain;
        this.tenantRlsContext = tenantRlsContext;
    }

    public FirebaseUserSyncService(
        FirebaseAuth firebaseAuth,
        TenantRepository tenants,
        JdbcTemplate jdbcTemplate,
        String bootstrapAdminEmail,
        String bootstrapAdminTenantSubdomain
    ) {
        this(firebaseAuth, tenants, jdbcTemplate, bootstrapAdminEmail, bootstrapAdminTenantSubdomain, "", "", null);
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
        } else if (isTenantAdmin(user) || isBootstrapAdmin(user)) {
            tenantId = adminTenantId(user, tenantId,
                tenants.findAll().stream().map(Tenant::getId).collect(java.util.stream.Collectors.toUnmodifiableSet()));
            if (tenantId == null) {
                throw new IllegalStateException("CareSync tenant is not available for admin provisioning");
            }
            role = isTenantAdmin(user) ? "TENANT_ADMIN" : "ADMIN";
            claims.put("role", role);
            claims.put("tenant_id", tenantId.toString());
            firebaseAuth.setCustomUserClaims(uid, claims);
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
        writeBatch(List.of(new SyncUser(uid, normalizeEmail(user.getEmail() == null ? email : user.getEmail()),
            role, tenantId, user.isDisabled())));
        if (!platformAdmin && (tenantId == null || role == null)) {
            jdbcTemplate.update("""
                INSERT INTO registration_requests (email, firebase_uid, requested_role, status)
                VALUES (?, ?, 'PATIENT', 'PENDING')
                ON CONFLICT (firebase_uid) WHERE status = 'PENDING' DO NOTHING
                """,
                normalizeEmail(user.getEmail() == null ? email : user.getEmail()), uid
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
                } else if (isTenantAdmin(user) || isBootstrapAdmin(user)) {
                    UUID adminTenantId = adminTenantId(user, tenantId, existingTenants);
                    if (adminTenantId != null) {
                        String provisionedRole = isTenantAdmin(user) ? "TENANT_ADMIN" : "ADMIN";
                        boolean claimsChanged = !provisionedRole.equals(role)
                            || !adminTenantId.toString().equals(claims.get("tenant_id"));
                        if (claimsChanged) {
                            claims.put("role", provisionedRole);
                            claims.put("tenant_id", adminTenantId.toString());
                            firebaseAuth.setCustomUserClaims(user.getUid(), claims);
                        }
                        role = provisionedRole;
                        tenantId = adminTenantId;
                    }
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

    private boolean isBootstrapAdmin(UserRecord user) {
        return !bootstrapAdminEmails.isEmpty()
            && !isSuperAdmin(user)
            && user.isEmailVerified()
            && bootstrapAdminEmails.contains(normalizeEmail(user.getEmail()));
    }

    private boolean isTenantAdmin(UserRecord user) {
        return !tenantAdminEmails.isEmpty()
            && !isSuperAdmin(user)
            && user.isEmailVerified()
            && tenantAdminEmails.contains(normalizeEmail(user.getEmail()));
    }

    private boolean isSuperAdmin(UserRecord user) {
        return !superAdminEmails.isEmpty()
            && user.isEmailVerified()
            && superAdminEmails.contains(normalizeEmail(user.getEmail()));
    }

    private UUID bootstrapAdminTenantId(UUID claimedTenantId, Set<UUID> existingTenants, UserRecord user) {
        if (claimedTenantId != null) {
            return claimedTenantId;
        }
        Optional<Tenant> configuredTenant = tenants.findBySubdomain(bootstrapAdminTenantSubdomain);
        if (configuredTenant.isEmpty()) {
            Tenant tenant = new Tenant();
            tenant.setName("CareSync MedCare");
            tenant.setSubdomain(bootstrapAdminTenantSubdomain);
            tenant.setActive(true);
            configuredTenant = Optional.of(tenants.saveAndFlush(tenant));
            LOGGER.info("Created CareSync tenant '{}' during bootstrap provisioning", bootstrapAdminTenantSubdomain);
        }
        return configuredTenant.map(Tenant::getId).orElse(null);
    }

    private UUID adminTenantId(UserRecord user, UUID claimedTenantId, Set<UUID> existingTenants) {
        // The allow-listed tenant admin always belongs to the configured CareSync tenant.
        // A stale or forged tenant claim must not move this account to another tenant.
        return bootstrapAdminTenantId(isTenantAdmin(user) ? null : claimedTenantId, existingTenants, user);
    }

    private static String stringClaim(Object claim) {
        return claim instanceof String value && !value.isBlank() ? value : null;
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public record ProvisionedUser(UUID tenantId, String role, String specialty, String status) { }
    private record SyncUser(String uid, String email, String role, UUID tenantId, boolean disabled) { }
}
