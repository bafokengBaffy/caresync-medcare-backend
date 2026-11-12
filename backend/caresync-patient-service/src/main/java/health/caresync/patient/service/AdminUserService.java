package health.caresync.patient.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.UserRecord;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.domain.entity.Tenant;
import health.caresync.patient.domain.repository.TenantRepository;
import health.caresync.patient.dto.admin.AdminUserResponse;
import health.caresync.patient.dto.admin.FirebaseAccountLookupResponse;
import health.caresync.patient.dto.admin.ProvisionUserRequest;
import health.caresync.patient.dto.admin.UpdateUserRoleRequest;
import jakarta.servlet.http.HttpServletRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Service
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class AdminUserService {
    private static final Set<String> ALLOWED_ROLES = Set.of(
        "SUPER_ADMIN", "TENANT_ADMIN", "PROVIDER", "STAFF", "RECEPTION",
        "FINANCE", "MANAGER", "CONSENT_MANAGER", "CLINICIAN", "PRIVACY_OFFICER",
        "RECEPTIONIST", "PATIENT"
    );
    private static final Set<String> SPECIALTIES = Set.of(
        "DENTAL", "MENTAL_HEALTH", "OPTOMETRY", "NURSING", "WELLNESS", "COMMUNITY"
    );
    private static final Pattern PERMISSION_FORMAT = Pattern.compile("[A-Z][A-Z0-9_]{1,63}");

    private final FirebaseAuth firebaseAuth;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRepository tenants;
    private final TenantRlsContext tenantRlsContext;
    private final AuditService auditService;

    public AdminUserService(
        FirebaseAuth firebaseAuth,
        JdbcTemplate jdbcTemplate,
        TenantRepository tenants,
        TenantRlsContext tenantRlsContext,
        AuditService auditService
    ) {
        this.firebaseAuth = firebaseAuth;
        this.jdbcTemplate = jdbcTemplate;
        this.tenants = tenants;
        this.tenantRlsContext = tenantRlsContext;
        this.auditService = auditService;
    }

    public FirebaseAccountLookupResponse lookupFirebaseAccount(String email) {
        String normalizedEmail = normalize(email);
        if (normalizedEmail.isBlank()) throw new ValidationException("Email is required");
        try {
            UserRecord user = firebaseAuth.getUserByEmail(normalizedEmail);
            return new FirebaseAccountLookupResponse(user.getUid(), user.getEmail(), user.getDisplayName());
        } catch (FirebaseAuthException exception) {
            if (exception.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                throw new NotFoundException("Firebase account not found");
            }
            throw new IllegalStateException("Could not verify Firebase account", exception);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> list(
        CaresyncPrincipal actor,
        UUID requestedTenantId,
        String role,
        String status,
        String search,
        int page,
        int size,
        String sort,
        String direction
    ) {
        validatePage(page, size);
        UUID tenantId = authorizedTenant(actor, requestedTenantId, false);
        tenantRlsContext.apply(actor, tenantId);

        List<Object> parameters = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE u.deleted_at IS NULL AND u.role IS DISTINCT FROM 'ADMIN'");
        if (tenantId != null) {
            where.append(" AND u.tenant_id = ?");
            parameters.add(tenantId);
        }
        if (role != null && !role.isBlank()) {
            requireRole(role);
            where.append(" AND u.role = ?");
            parameters.add(role);
        }
        if (status != null && !status.isBlank()) {
            switch (status.toUpperCase(Locale.ROOT)) {
                case "ACTIVE" -> where.append(" AND u.disabled = FALSE");
                case "SUSPENDED" -> where.append(" AND u.disabled = TRUE");
                default -> throw new ValidationException("Status must be ACTIVE or SUSPENDED");
            }
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
            where.append(" AND (lower(u.email) LIKE ? ESCAPE '\\' OR lower(coalesce(p.full_name, '')) LIKE ? ESCAPE '\\' OR u.firebase_uid LIKE ? ESCAPE '\\')");
            parameters.add(pattern);
            parameters.add(pattern);
            parameters.add(pattern);
        }

        String orderColumn = switch (sort == null ? "createdAt" : sort) {
            case "email" -> "u.email";
            case "role" -> "u.role";
            case "status" -> "u.disabled";
            case "createdAt" -> "u.created_at";
            default -> throw new ValidationException("Unsupported user sort field");
        };
        String orderDirection = switch (direction == null ? "asc" : direction.toLowerCase(Locale.ROOT)) {
            case "asc" -> "ASC";
            case "desc" -> "DESC";
            default -> throw new ValidationException("Sort direction must be asc or desc");
        };
        long offset = (long) page * size;
        String baseQuery = """
            FROM firebase_users u
            LEFT JOIN user_profiles p ON p.firebase_uid = u.firebase_uid AND p.deleted_at IS NULL
            """ + where;

        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + baseQuery, Long.class, parameters.toArray());
        List<Object> pageParameters = new ArrayList<>(parameters);
        pageParameters.add(size);
        pageParameters.add(offset);
        List<AdminUserResponse> content = jdbcTemplate.query(
            "SELECT u.firebase_uid, u.email, u.role, u.tenant_id, u.disabled, u.created_at, "
                + "p.full_name, p.phone, p.profile_image_url "
                + baseQuery + " ORDER BY " + orderColumn + " " + orderDirection
                + " NULLS LAST, u.firebase_uid ASC LIMIT ? OFFSET ?",
            (resultSet, rowNumber) -> mapUser(resultSet, null, List.of()),
            pageParameters.toArray()
        );
        return new PageResponse<>(content, page, size, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse get(CaresyncPrincipal actor, String firebaseUid, UUID requestedTenantId) {
        requireUid(firebaseUid);
        UUID tenantId = authorizedTenant(actor, requestedTenantId, false);
        tenantRlsContext.apply(actor, tenantId);
        AdminUserResponse user = findUser(firebaseUid, tenantId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        List<String> permissions = jdbcTemplate.query(
            "SELECT permission FROM user_permissions WHERE firebase_uid = ? ORDER BY permission",
            (resultSet, rowNumber) -> resultSet.getString(1),
            firebaseUid
        );
        String providerId = user.tenantId() == null ? null : jdbcTemplate.query(
                "SELECT id::text FROM providers WHERE user_id = ? AND tenant_id = ? AND is_active = TRUE LIMIT 1",
                resultSet -> resultSet.next() ? resultSet.getString(1) : null,
                firebaseUid,
                user.tenantId()
            );
        return new AdminUserResponse(
            user.firebaseUid(), user.email(), user.fullName(), user.phone(), user.profileImageUrl(),
            user.tenantId(), user.role(), user.status(), providerId, permissions, user.createdAt()
        );
    }

    @Transactional
    public AdminUserResponse provision(
        CaresyncPrincipal actor,
        ProvisionUserRequest request,
        HttpServletRequest servletRequest
    ) {
        UUID tenantId = targetTenant(actor, request.role(), request.tenantId());
        requireProviderData(request.role(), request.fullName(), request.specialty());
        requirePatientLink(request.role(), request.patientId());
        validatePermissions(request.permissions());
        tenantRlsContext.apply(actor, tenantId);
        boolean createFirebaseUser = request.firebaseUid() == null || request.firebaseUid().isBlank();
        UserRecord firebaseUser = createFirebaseUser
            ? createFirebaseUser(request.email(), request.fullName())
            : getFirebaseUser(request.firebaseUid());
        if (!createFirebaseUser && !normalize(firebaseUser.getEmail()).equals(normalize(request.email()))) {
            throw new ValidationException("The selected Firebase account email does not match the request");
        }

        Map<String, Object> claims = new HashMap<>(firebaseUser.getCustomClaims());
        claims.put("role", request.role());
        claims.put("permissions", sortedPermissions(request.permissions()));
        if (request.specialty() != null) claims.put("specialty", request.specialty());
        if (tenantId == null) claims.remove("tenant_id");
        else claims.put("tenant_id", tenantId.toString());

        try {
            setClaims(firebaseUser.getUid(), claims);
            upsertUser(firebaseUser.getUid(), normalize(firebaseUser.getEmail()), request.role(), tenantId,
                firebaseUser.isDisabled(), request.fullName(), request.phone());
            replaceRoleAssignment(firebaseUser.getUid(), request.role(), tenantId, actor.userId());
            replacePermissions(firebaseUser.getUid(), tenantId, request.permissions(), actor.userId());
            linkProvider(firebaseUser.getUid(), tenantId, request.fullName(), request.role(), request.specialty());
            linkPatient(firebaseUser.getUid(), tenantId, request.patientId(), request.role());
            auditService.recordAdministrativeAction(
                actor, tenantId, "USER_PROVISIONED", "USER", firebaseUser.getUid(), servletRequest
            );
        } catch (RuntimeException exception) {
            if (createFirebaseUser) {
                try {
                    firebaseAuth.deleteUser(firebaseUser.getUid());
                } catch (FirebaseAuthException cleanupFailure) {
                    exception.addSuppressed(cleanupFailure);
                }
            } else {
                restoreClaims(firebaseUser.getUid(), firebaseUser.getCustomClaims(), exception);
            }
            throw exception;
        }
        return get(actor, firebaseUser.getUid(), tenantId);
    }

    private UserRecord createFirebaseUser(String email, String fullName) {
        try {
            return firebaseAuth.createUser(
                new UserRecord.CreateRequest()
                    .setEmail(normalize(email))
                    .setDisplayName(fullName.trim())
            );
        } catch (FirebaseAuthException exception) {
            if (exception.getAuthErrorCode() == AuthErrorCode.EMAIL_ALREADY_EXISTS) {
                throw new ValidationException("A Firebase account already exists for this email; use account lookup");
            }
            throw new IllegalStateException("Could not create Firebase account", exception);
        }
    }

    @Transactional
    public AdminUserResponse updateRole(
        CaresyncPrincipal actor,
        String firebaseUid,
        UpdateUserRoleRequest request,
        HttpServletRequest servletRequest
    ) {
        requireUid(firebaseUid);
        requireRole(request.role());
        if ("SUPER_ADMIN".equals(request.role())) {
            throw new ForbiddenException("SUPER_ADMIN grants require the platform-owner bootstrap process");
        }
        if (isPrivilegedRole(request.role()) && !"SUPER_ADMIN".equals(actor.role())) {
            throw new ForbiddenException("Only a platform administrator may assign platform roles");
        }
        UUID requestedTenant = request.tenantId();
        if (requestedTenant == null && !"SUPER_ADMIN".equals(request.role())) {
            requestedTenant = actor.tenantId();
        }
        UUID tenantId = targetTenant(actor, request.role(), requestedTenant);
        validatePermissions(request.permissions());
        tenantRlsContext.apply(actor, tenantId);

        AdminUserResponse existing = findUser(firebaseUid, tenantId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if ("ADMIN".equals(existing.role()) && !"SUPER_ADMIN".equals(actor.role())) {
            throw new ForbiddenException("Legacy ADMIN accounts require platform review before role changes");
        }
        requireProviderData(request.role(), existing.fullName(), request.specialty());
        requirePatientLink(request.role(), request.patientId());
        UserRecord firebaseUser = getFirebaseUser(firebaseUid);
        Map<String, Object> oldClaims = new HashMap<>(firebaseUser.getCustomClaims());
        Map<String, Object> claims = new HashMap<>(oldClaims);
        claims.put("role", request.role());
        claims.put("permissions", sortedPermissions(request.permissions()));
        if (request.specialty() != null) claims.put("specialty", request.specialty());
        else claims.remove("specialty");
        if (tenantId == null) claims.remove("tenant_id");
        else claims.put("tenant_id", tenantId.toString());
        setClaims(firebaseUid, claims);
        try {
            jdbcTemplate.update(
                "UPDATE firebase_users SET role = ?, tenant_id = ?, synced_at = NOW() WHERE firebase_uid = ?",
                request.role(), tenantId, firebaseUid
            );
            jdbcTemplate.update(
                "UPDATE user_profiles SET tenant_id = ?, updated_at = NOW() WHERE firebase_uid = ?",
                tenantId, firebaseUid
            );
            jdbcTemplate.update("DELETE FROM user_role_assignments WHERE firebase_uid = ?", firebaseUid);
            replaceRoleAssignment(firebaseUid, request.role(), tenantId, actor.userId());
            replacePermissions(firebaseUid, tenantId, request.permissions(), actor.userId());
            linkProvider(firebaseUid, tenantId, existing.fullName(), request.role(), request.specialty());
            linkPatient(firebaseUid, tenantId, request.patientId(), request.role());
            jdbcTemplate.update("""
                UPDATE legacy_admin_role_reviews
                SET review_status='MIGRATED', new_role=?, target_tenant_id=?, reviewed_by=?,
                    reviewed_at=NOW(), decision_source='super-admin-reviewed-role-provisioning'
                WHERE firebase_uid=? AND review_status='NEEDS_REVIEW'
                  AND legacy_tenant_id IS NOT DISTINCT FROM ?
                """, request.role(), tenantId, actor.userId(), firebaseUid, existing.tenantId());
            firebaseAuth.revokeRefreshTokens(firebaseUid);
            auditService.recordAdministrativeAction(
                actor, tenantId, "USER_ROLE_UPDATED", "USER", firebaseUid, servletRequest
            );
        } catch (FirebaseAuthException | RuntimeException exception) {
            restoreClaims(firebaseUid, oldClaims, exception);
            throw new IllegalStateException("Could not update user role", exception);
        }
        return get(actor, firebaseUid, tenantId);
    }

    @Transactional
    public AdminUserResponse updateStatus(
        CaresyncPrincipal actor,
        String firebaseUid,
        String status,
        UUID requestedTenantId,
        HttpServletRequest servletRequest
    ) {
        requireUid(firebaseUid);
        boolean disabled = switch (status == null ? "" : status.toUpperCase(Locale.ROOT)) {
            case "ACTIVE" -> false;
            case "SUSPENDED" -> true;
            default -> throw new ValidationException("Status must be ACTIVE or SUSPENDED");
        };
        UUID tenantId = authorizedTenant(actor, requestedTenantId, false);
        tenantRlsContext.apply(actor, tenantId);
        AdminUserResponse existing = findUser(firebaseUid, tenantId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (existing.tenantId() != null && !Objects.equals(existing.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        try {
            firebaseAuth.updateUser(new UserRecord.UpdateRequest(firebaseUid).setDisabled(disabled));
            if (disabled) firebaseAuth.revokeRefreshTokens(firebaseUid);
        } catch (FirebaseAuthException exception) {
            throw new IllegalStateException("Could not update Firebase account status", exception);
        }
        jdbcTemplate.update(
            "UPDATE firebase_users SET disabled = ?, synced_at = NOW() WHERE firebase_uid = ?",
            disabled, firebaseUid
        );
        auditService.recordAdministrativeAction(
            actor, existing.tenantId(), disabled ? "USER_SUSPENDED" : "USER_ACTIVATED",
            "USER", firebaseUid, servletRequest
        );
        return get(actor, firebaseUid, tenantId);
    }

    @Transactional
    public void revokeSessions(
        CaresyncPrincipal actor,
        String firebaseUid,
        UUID requestedTenantId,
        HttpServletRequest servletRequest
    ) {
        requireUid(firebaseUid);
        UUID tenantId = authorizedTenant(actor, requestedTenantId, false);
        tenantRlsContext.apply(actor, tenantId);
        AdminUserResponse existing = findUser(firebaseUid, tenantId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (existing.tenantId() != null && !Objects.equals(existing.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        try {
            firebaseAuth.revokeRefreshTokens(firebaseUid);
        } catch (FirebaseAuthException exception) {
            throw new IllegalStateException("Could not revoke Firebase sessions", exception);
        }
        auditService.recordAdministrativeAction(
            actor, tenantId, "USER_SESSIONS_REVOKED", "USER", firebaseUid, servletRequest
        );
    }

    @Transactional
    public void softDelete(
        CaresyncPrincipal actor,
        String firebaseUid,
        UUID requestedTenantId,
        HttpServletRequest servletRequest
    ) {
        requireUid(firebaseUid);
        UUID tenantId = authorizedTenant(actor, requestedTenantId, false);
        tenantRlsContext.apply(actor, tenantId);
        AdminUserResponse existing = findUser(firebaseUid, tenantId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (existing.tenantId() != null && !Objects.equals(existing.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        try {
            firebaseAuth.updateUser(new UserRecord.UpdateRequest(firebaseUid).setDisabled(true));
            firebaseAuth.revokeRefreshTokens(firebaseUid);
            Map<String, Object> claims = new HashMap<>(firebaseAuth.getUser(firebaseUid).getCustomClaims());
            claims.remove("role");
            claims.remove("tenant_id");
            claims.remove("permissions");
            firebaseAuth.setCustomUserClaims(firebaseUid, claims);
        } catch (FirebaseAuthException exception) {
            throw new IllegalStateException("Could not disable Firebase account", exception);
        }
        jdbcTemplate.update(
            "UPDATE firebase_users SET disabled = TRUE, deleted_at = NOW(), synced_at = NOW() WHERE firebase_uid = ?",
            firebaseUid
        );
        jdbcTemplate.update(
            "UPDATE user_profiles SET deleted_at = NOW(), updated_at = NOW() WHERE firebase_uid = ?",
            firebaseUid
        );
        jdbcTemplate.update("DELETE FROM user_role_assignments WHERE firebase_uid = ?", firebaseUid);
        jdbcTemplate.update("DELETE FROM user_permissions WHERE firebase_uid = ?", firebaseUid);
        auditService.recordAdministrativeAction(
            actor, existing.tenantId(), "USER_SOFT_DELETED", "USER", firebaseUid, servletRequest
        );
    }

    private UUID targetTenant(CaresyncPrincipal actor, String role, UUID requestedTenantId) {
        requireRole(role);
        if ("SUPER_ADMIN".equals(role)) {
            throw new ForbiddenException("SUPER_ADMIN grants require the platform-owner bootstrap process");
        }
        if (isPrivilegedRole(role) && (actor == null || !"SUPER_ADMIN".equals(actor.role()))) {
            throw new ForbiddenException("Only a platform administrator may assign platform roles");
        }
        if ("SUPER_ADMIN".equals(role)) {
            if (!"SUPER_ADMIN".equals(actor.role())) {
                throw new ForbiddenException("Only a platform administrator may assign platform roles");
            }
            if (requestedTenantId != null) {
                throw new ValidationException("A platform administrator must not be assigned to a tenant");
            }
            return null;
        }
        UUID tenantId = authorizedTenant(actor, requestedTenantId, true);
        if (tenantId == null) throw new ValidationException("A tenant must be selected for this role");
        Tenant tenant = tenants.findById(tenantId)
            .orElseThrow(() -> new ValidationException("The requested tenant does not exist"));
        if (!tenant.isActive()) throw new ValidationException("The requested tenant is inactive");
        return tenantId;
    }

    private UUID authorizedTenant(CaresyncPrincipal actor, UUID requestedTenantId, boolean required) {
        if (actor == null || actor.role() == null) throw new ForbiddenException("Access denied");
        if ("SUPER_ADMIN".equals(actor.role())) return requestedTenantId;
        if (!"TENANT_ADMIN".equals(actor.role())) throw new ForbiddenException("Access denied");
        if (actor.tenantId() == null
            || requestedTenantId != null && !actor.tenantId().equals(requestedTenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        if (required && actor.tenantId() == null) throw new ForbiddenException("Tenant access denied");
        return actor.tenantId();
    }

    private java.util.Optional<AdminUserResponse> findUser(String firebaseUid, UUID tenantId) {
        String tenantFilter = tenantId == null ? "" : " AND u.tenant_id = ?";
        return jdbcTemplate.query("""
            SELECT u.firebase_uid, u.email, u.role, u.tenant_id, u.disabled, u.created_at, u.deleted_at,
                   p.full_name, p.phone, p.profile_image_url
            FROM firebase_users u
            LEFT JOIN user_profiles p ON p.firebase_uid = u.firebase_uid
            WHERE u.firebase_uid = ?
            """ + tenantFilter,
            statement -> {
                statement.setString(1, firebaseUid);
                if (tenantId != null) statement.setObject(2, tenantId);
            },
            resultSet -> resultSet.next()
                ? java.util.Optional.of(mapUser(resultSet, null, List.of()))
                : java.util.Optional.empty()
        );
    }

    private static AdminUserResponse mapUser(ResultSet resultSet, String providerId, List<String> permissions)
        throws SQLException {
        UUID tenantId = resultSet.getObject("tenant_id", UUID.class);
        boolean deleted = resultSet.getTimestamp("deleted_at") != null;
        boolean disabled = resultSet.getBoolean("disabled");
        Timestamp created = resultSet.getTimestamp("created_at");
        return new AdminUserResponse(
            resultSet.getString("firebase_uid"),
            resultSet.getString("email"),
            resultSet.getString("full_name"),
            resultSet.getString("phone"),
            resultSet.getString("profile_image_url"),
            tenantId,
            resultSet.getString("role"),
            deleted ? "DELETED" : disabled ? "SUSPENDED" : "ACTIVE",
            providerId,
            permissions,
            created == null ? null : created.toInstant()
        );
    }

    private void upsertUser(
        String firebaseUid,
        String email,
        String role,
        UUID tenantId,
        boolean disabled,
        String fullName,
        String phone
    ) {
        jdbcTemplate.update("""
            INSERT INTO firebase_users (firebase_uid, email, role, tenant_id, disabled, synced_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NULL)
            ON CONFLICT (firebase_uid) DO UPDATE SET
                email = EXCLUDED.email,
                role = EXCLUDED.role,
                tenant_id = EXCLUDED.tenant_id,
                disabled = EXCLUDED.disabled,
                deleted_at = NULL,
                synced_at = NOW()
            """,
            firebaseUid, email, role, tenantId, disabled
        );
        jdbcTemplate.update("""
            INSERT INTO user_profiles (firebase_uid, full_name, phone, email, tenant_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (firebase_uid) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                tenant_id = EXCLUDED.tenant_id,
                deleted_at = NULL,
                updated_at = NOW()
            """,
            firebaseUid, fullName.trim(), normalizePhone(phone), email, tenantId
        );
    }

    private void replaceRoleAssignment(String firebaseUid, String role, UUID tenantId, String assignedBy) {
        jdbcTemplate.update(
            "INSERT INTO user_role_assignments (firebase_uid, role, tenant_id, assigned_by) VALUES (?, ?, ?, ?)",
            firebaseUid, role, tenantId, assignedBy
        );
    }

    private void replacePermissions(String firebaseUid, UUID tenantId, Set<String> permissions, String grantedBy) {
        if (tenantId == null) return;
        jdbcTemplate.update(
            "DELETE FROM user_permissions WHERE firebase_uid = ? AND tenant_id = ?",
            firebaseUid, tenantId
        );
        for (String permission : sortedPermissions(permissions)) {
            jdbcTemplate.update(
                "INSERT INTO user_permissions (firebase_uid, tenant_id, permission, granted_by) VALUES (?, ?, ?, ?)",
                firebaseUid, tenantId, permission, grantedBy
            );
        }
    }

    private void linkProvider(String uid, UUID tenantId, String fullName, String role, String specialty) {
        boolean clinicalRole = "PROVIDER".equals(role) || "CLINICIAN".equals(role);
        if (!clinicalRole) {
            if (tenantId == null) {
                jdbcTemplate.update("UPDATE providers SET is_active = FALSE WHERE user_id = ?", uid);
            } else {
                jdbcTemplate.update(
                    "UPDATE providers SET is_active = FALSE WHERE user_id = ? AND tenant_id = ?",
                    uid,
                    tenantId
                );
            }
            return;
        }
        if (tenantId == null || specialty == null || !SPECIALTIES.contains(specialty)) {
            throw new ValidationException("Provider and clinician roles require a tenant and valid specialty");
        }
        String[] parts = fullName == null ? new String[0] : fullName.trim().split("\\s+", 2);
        if (parts.length < 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new ValidationException("Provider and clinician profiles require first and last names");
        }
        jdbcTemplate.update("""
            INSERT INTO providers (tenant_id, user_id, first_name, last_name, specialty, is_active)
            VALUES (?, ?, ?, ?, ?, TRUE)
            ON CONFLICT (tenant_id, user_id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                specialty = EXCLUDED.specialty,
                is_active = TRUE
            """,
            tenantId, uid, parts[0], parts[1], specialty
        );
    }

    private void linkPatient(String uid, UUID tenantId, UUID patientId, String role) {
        if (!"PATIENT".equals(role)) return;
        if (patientId == null || tenantId == null) {
            throw new ValidationException("Patient roles must be linked to a patient record and tenant");
        }
        int linked = jdbcTemplate.update("""
            UPDATE patients
            SET firebase_uid = ?
            WHERE id = ? AND tenant_id = ? AND (firebase_uid IS NULL OR firebase_uid = ?)
            """,
            uid, patientId, tenantId, uid
        );
        if (linked != 1) {
            throw new ValidationException("The selected patient record does not exist in this tenant or is already linked");
        }
    }

    private static void requirePatientLink(String role, UUID patientId) {
        if ("PATIENT".equals(role) && patientId == null) {
            throw new ValidationException("Patient roles must be linked to a patient record");
        }
    }

    private UserRecord getFirebaseUser(String uid) {
        if (uid == null || uid.isBlank()) throw new ValidationException("Firebase UID is required");
        try {
            return firebaseAuth.getUser(uid);
        } catch (FirebaseAuthException exception) {
            if (exception.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                throw new NotFoundException("Firebase account not found");
            }
            throw new IllegalStateException("Could not verify Firebase account", exception);
        }
    }

    private void setClaims(String uid, Map<String, Object> claims) {
        try {
            firebaseAuth.setCustomUserClaims(uid, claims);
        } catch (FirebaseAuthException exception) {
            throw new IllegalStateException("Could not update Firebase access claims", exception);
        }
    }

    private void restoreClaims(String uid, Map<String, Object> oldClaims, RuntimeException failure) {
        try {
            firebaseAuth.setCustomUserClaims(uid, oldClaims);
        } catch (FirebaseAuthException rollbackFailure) {
            failure.addSuppressed(rollbackFailure);
        }
    }

    private void restoreClaims(String uid, Map<String, Object> oldClaims, Exception failure) {
        try {
            firebaseAuth.setCustomUserClaims(uid, oldClaims);
        } catch (FirebaseAuthException rollbackFailure) {
            failure.addSuppressed(rollbackFailure);
        }
    }

    private static void requireProviderData(String role, String fullName, String specialty) {
        if (("PROVIDER".equals(role) || "CLINICIAN".equals(role))
            && (specialty == null || !SPECIALTIES.contains(specialty))) {
            throw new ValidationException("Provider and clinician roles require a valid specialty");
        }
        if (("PROVIDER".equals(role) || "CLINICIAN".equals(role))
            && (fullName == null || fullName.trim().split("\\s+", 2).length < 2)) {
            throw new ValidationException("Provider and clinician roles require first and last names");
        }
    }

    private static void validatePermissions(Set<String> permissions) {
        if (permissions == null) return;
        if (permissions.size() > 100 || permissions.stream().anyMatch(value ->
            value == null || !PERMISSION_FORMAT.matcher(value).matches())) {
            throw new ValidationException("Invalid permissions list");
        }
    }

    private static List<String> sortedPermissions(Set<String> permissions) {
        return permissions == null ? List.of() : permissions.stream().sorted(Comparator.naturalOrder()).toList();
    }

    private static void requireRole(String role) {
        if (role == null || !ALLOWED_ROLES.contains(role)) throw new ValidationException("Unsupported user role");
    }

    private static boolean isPrivilegedRole(String role) {
        return "TENANT_ADMIN".equals(role);
    }

    public List<LegacyAdminRoleReview> legacyAdminRoleReviews(CaresyncPrincipal actor) {
        if (actor == null || !"SUPER_ADMIN".equals(actor.role())) throw new ForbiddenException("Access denied");
        return jdbcTemplate.query("""
            SELECT firebase_uid, legacy_tenant_id, prior_role, review_status, migration_time,
                   new_role, target_tenant_id, reviewed_by, reviewed_at, decision_source
            FROM legacy_admin_role_reviews ORDER BY review_status, migration_time, firebase_uid
            """, (rs, row) -> new LegacyAdminRoleReview(rs.getString("firebase_uid"),
                rs.getObject("legacy_tenant_id", UUID.class), rs.getString("prior_role"),
                rs.getString("review_status"), rs.getTimestamp("migration_time").toInstant(),
                rs.getString("new_role"), rs.getObject("target_tenant_id", UUID.class),
                rs.getString("reviewed_by"), rs.getTimestamp("reviewed_at") == null ? null : rs.getTimestamp("reviewed_at").toInstant(),
                rs.getString("decision_source")));
    }

    public record LegacyAdminRoleReview(String firebaseUid, UUID legacyTenantId, String priorRole,
        String reviewStatus, java.time.Instant migrationTime, String newRole, UUID targetTenantId,
        String reviewedBy, java.time.Instant reviewedAt, String decisionSource) { }

    private static void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizePhone(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim();
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static void requireUid(String uid) {
        if (uid == null || !uid.matches("[A-Za-z0-9._:-]{1,128}")) {
            throw new ValidationException("Invalid Firebase UID");
        }
    }
}
