package health.caresync.patient.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.domain.entity.Tenant;
import health.caresync.patient.domain.repository.TenantRepository;
import health.caresync.patient.dto.admin.BulkFixPendingActivationsRequest;
import health.caresync.patient.dto.admin.RegistrationRequestResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Locale;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class AdminRegistrationService {
    private final FirebaseAuth firebaseAuth;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRepository tenants;
    private final TenantRlsContext tenantRlsContext;
    private final AuditService auditService;

    public AdminRegistrationService(
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

    @Transactional(readOnly = true)
    public PageResponse<RegistrationRequestResponse> list(
        CaresyncPrincipal actor,
        UUID requestedTenantId,
        String status,
        String search,
        int page,
        int size
    ) {
        validatePage(page, size);
        UUID tenantId = authorizedTenant(actor, requestedTenantId);
        tenantRlsContext.apply(actor, tenantId);
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        java.util.ArrayList<Object> parameters = new java.util.ArrayList<>();
        if (tenantId != null) {
            where.append(" AND requested_tenant_id = ?");
            parameters.add(tenantId);
        }
        String normalizedStatus = status == null || status.isBlank() ? "PENDING" : status.toUpperCase(Locale.ROOT);
        if ("ALL".equals(normalizedStatus)) normalizedStatus = null;
        if (normalizedStatus != null && !List.of("PENDING", "APPROVED", "REJECTED").contains(normalizedStatus)) {
            throw new ValidationException("Status must be PENDING, APPROVED, or REJECTED");
        }
        if (normalizedStatus != null) {
            where.append(" AND status = ?");
            parameters.add(normalizedStatus);
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            where.append(" AND (lower(email) LIKE ? OR lower(firebase_uid) LIKE ?)");
            parameters.add(pattern);
            parameters.add(pattern);
        }
        Long total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM registration_requests" + where, Long.class, parameters.toArray()
        );
        parameters.add(size);
        parameters.add((long) page * size);
        List<RegistrationRequestResponse> content = jdbcTemplate.query(
            "SELECT id, email, firebase_uid, requested_role, requested_tenant_id, status, "
                + "submitted_at, reviewed_by, reviewed_at, rejection_reason FROM registration_requests"
                + where + " ORDER BY submitted_at DESC, id LIMIT ? OFFSET ?",
            this::mapRequest,
            parameters.toArray()
        );
        return new PageResponse<>(content, page, size, total == null ? 0 : total);
    }

    @Transactional
    public RegistrationRequestResponse approve(
        CaresyncPrincipal actor,
        UUID requestId,
        UUID targetTenantId,
        UUID patientId,
        HttpServletRequest servletRequest
    ) {
        RegistrationRequestResponse request = findRequest(actor, requestId, targetTenantId);
        if (!"PENDING".equals(request.status())) {
            throw new ValidationException("Only pending registration requests can be approved");
        }
        UUID tenantId = targetTenantId == null ? request.requestedTenantId() : targetTenantId;
        if (tenantId == null) throw new ValidationException("A tenant must be selected for approval");
        if (patientId == null) throw new ValidationException("A patient record must be selected for approval");
        Tenant tenant = tenants.findById(tenantId)
            .orElseThrow(() -> new ValidationException("The selected tenant does not exist"));
        if (!tenant.isActive()) throw new ValidationException("The selected tenant is inactive");
        tenantRlsContext.apply(actor, tenantId);

        UserRecord firebaseUser;
        try {
            firebaseUser = firebaseAuth.getUser(request.firebaseUid());
        } catch (FirebaseAuthException exception) {
            if (exception.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                throw new NotFoundException("Firebase account not found");
            }
            throw new IllegalStateException("Could not verify Firebase account", exception);
        }
        Map<String, Object> oldClaims = new HashMap<>(firebaseUser.getCustomClaims());
        Map<String, Object> claims = new HashMap<>(oldClaims);
        claims.put("role", "PATIENT");
        claims.put("tenant_id", tenantId.toString());
        claims.remove("permissions");
        claims.remove("specialty");
        try {
            firebaseAuth.setCustomUserClaims(request.firebaseUid(), claims);
            jdbcTemplate.update("""
                INSERT INTO firebase_users (firebase_uid, email, role, tenant_id, disabled, synced_at, deleted_at)
                VALUES (?, ?, 'PATIENT', ?, FALSE, NOW(), NULL)
                ON CONFLICT (firebase_uid) DO UPDATE SET
                    email = EXCLUDED.email,
                    role = 'PATIENT',
                    tenant_id = EXCLUDED.tenant_id,
                    disabled = FALSE,
                    deleted_at = NULL,
                    synced_at = NOW()
                """,
                request.firebaseUid(), request.email(), tenantId
            );
            jdbcTemplate.update("""
                INSERT INTO user_profiles (firebase_uid, full_name, email, tenant_id)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (firebase_uid) DO UPDATE SET
                    email = EXCLUDED.email,
                    tenant_id = EXCLUDED.tenant_id,
                    deleted_at = NULL,
                    updated_at = NOW()
                """,
                request.firebaseUid(),
                firebaseUser.getDisplayName() == null ? "" : firebaseUser.getDisplayName(),
                request.email(),
                tenantId
            );
            jdbcTemplate.update(
                "DELETE FROM user_role_assignments WHERE firebase_uid = ?",
                request.firebaseUid()
            );
            jdbcTemplate.update(
                "INSERT INTO user_role_assignments (firebase_uid, role, tenant_id, assigned_by) VALUES (?, 'PATIENT', ?, ?)",
                request.firebaseUid(), tenantId, actor.userId()
            );
            int linked = jdbcTemplate.update("""
                UPDATE patients
                SET firebase_uid = ?
                WHERE id = ? AND tenant_id = ? AND (firebase_uid IS NULL OR firebase_uid = ?)
                """,
                request.firebaseUid(), patientId, tenantId, request.firebaseUid()
            );
            if (linked != 1) {
                throw new ValidationException("The selected patient record does not exist in this tenant or is already linked");
            }
            int updated = jdbcTemplate.update("""
                UPDATE registration_requests
                SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = NULL
                WHERE id = ? AND status = 'PENDING'
                """,
                actor.userId(), requestId
            );
            if (updated != 1) throw new ValidationException("Registration request was already reviewed");
            firebaseAuth.revokeRefreshTokens(request.firebaseUid());
            auditService.recordAdministrativeAction(
                actor, tenantId, "REGISTRATION_APPROVED", "REGISTRATION_REQUEST",
                requestId.toString(), servletRequest
            );
        } catch (FirebaseAuthException | RuntimeException exception) {
            try {
                firebaseAuth.setCustomUserClaims(request.firebaseUid(), oldClaims);
            } catch (FirebaseAuthException rollbackFailure) {
                exception.addSuppressed(rollbackFailure);
            }
            throw new IllegalStateException("Could not approve registration request", exception);
        }
        return new RegistrationRequestResponse(
            request.id(), request.email(), request.firebaseUid(), request.requestedRole(),
            tenantId, "APPROVED", request.submittedAt(), actor.userId(),
            java.time.Instant.now(), null
        );
    }

    @Transactional
    public RegistrationRequestResponse reject(
        CaresyncPrincipal actor,
        UUID requestId,
        UUID requestedTenantId,
        String reason,
        HttpServletRequest servletRequest
    ) {
        if (reason == null || reason.isBlank() || reason.length() > 1000) {
            throw new ValidationException("A rejection reason between 1 and 1000 characters is required");
        }
        RegistrationRequestResponse request = findRequest(actor, requestId, requestedTenantId);
        if (!"PENDING".equals(request.status())) {
            throw new ValidationException("Only pending registration requests can be rejected");
        }
        tenantRlsContext.apply(actor,
            requestedTenantId == null ? request.requestedTenantId() : requestedTenantId);
        int updated = jdbcTemplate.update("""
            UPDATE registration_requests
            SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ?
            WHERE id = ? AND status = 'PENDING'
            """,
            actor.userId(), reason.trim(), requestId
        );
        if (updated != 1) throw new ValidationException("Registration request was already reviewed");
        auditService.recordAdministrativeAction(
            actor, request.requestedTenantId(), "REGISTRATION_REJECTED", "REGISTRATION_REQUEST",
            requestId.toString(), servletRequest
        );
        return new RegistrationRequestResponse(
            request.id(), request.email(), request.firebaseUid(), request.requestedRole(),
            request.requestedTenantId(), "REJECTED", request.submittedAt(), actor.userId(),
            java.time.Instant.now(), reason.trim()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<PendingActivationResponse> pendingActivations(
        CaresyncPrincipal actor,
        UUID requestedTenantId,
        int page,
        int size
    ) {
        validatePage(page, size);
        UUID tenantId = authorizedTenant(actor, requestedTenantId);
        tenantRlsContext.apply(actor, tenantId);
        String filter = tenantId == null ? "" : " AND u.tenant_id = ?";
        Object[] filterParameters = tenantId == null ? new Object[0] : new Object[] { tenantId };
        Long total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM firebase_users u WHERE u.deleted_at IS NULL "
                + "AND (u.role IS NULL OR (u.role <> 'SUPER_ADMIN' AND u.tenant_id IS NULL))" + filter,
            Long.class,
            filterParameters
        );
        Object[] parameters = tenantId == null
            ? new Object[] { size, (long) page * size }
            : new Object[] { tenantId, size, (long) page * size };
        List<PendingActivationResponse> content = jdbcTemplate.query(
            "SELECT u.firebase_uid, u.email, u.role, u.tenant_id, u.disabled, u.synced_at "
                + "FROM firebase_users u WHERE u.deleted_at IS NULL "
                + "AND (u.role IS NULL OR (u.role <> 'SUPER_ADMIN' AND u.tenant_id IS NULL))"
                + filter + " ORDER BY u.synced_at DESC, u.firebase_uid LIMIT ? OFFSET ?",
            (resultSet, rowNumber) -> new PendingActivationResponse(
                resultSet.getString("firebase_uid"),
                resultSet.getString("email"),
                resultSet.getString("role"),
                resultSet.getObject("tenant_id", UUID.class),
                resultSet.getBoolean("disabled"),
                resultSet.getTimestamp("synced_at").toInstant()
            ),
            parameters
        );
        return new PageResponse<>(content, page, size, total == null ? 0 : total);
    }

    @Transactional
    public BulkFixResult bulkFixPendingActivations(
        CaresyncPrincipal actor,
        BulkFixPendingActivationsRequest request
    ) {
        if (actor == null || !"SUPER_ADMIN".equals(actor.role())) {
            throw new ForbiddenException("Super-admin role required");
        }
        tenantRlsContext.apply(actor, null);
        int fixed = 0;
        List<String> skipped = new ArrayList<>();
        for (String firebaseUid : request.ids().stream().distinct().toList()) {
            if (firebaseUid == null || firebaseUid.isBlank() || firebaseUid.length() > 128) {
                skipped.add("Invalid user identifier");
                continue;
            }
            RoleAssignment assignment = jdbcTemplate.query(
                """
                    SELECT role, tenant_id FROM user_role_assignments
                    WHERE firebase_uid = ? AND tenant_id IS NOT NULL AND role <> 'SUPER_ADMIN'
                    ORDER BY assigned_at DESC LIMIT 1
                    """,
                resultSet -> resultSet.next()
                    ? new RoleAssignment(resultSet.getString("role"), resultSet.getObject("tenant_id", UUID.class))
                    : null,
                firebaseUid
            );
            if (assignment == null) {
                skipped.add(firebaseUid + ": no existing tenant role assignment to restore");
                continue;
            }

            UserRecord firebaseUser;
            try {
                firebaseUser = firebaseAuth.getUser(firebaseUid);
            } catch (FirebaseAuthException exception) {
                if (exception.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                    skipped.add(firebaseUid + ": Firebase account not found");
                    continue;
                }
                throw new IllegalStateException("Could not load Firebase account " + firebaseUid, exception);
            }
            Map<String, Object> claims = new HashMap<>(firebaseUser.getCustomClaims());
            claims.put("role", assignment.role());
            claims.put("tenant_id", assignment.tenantId().toString());
            List<String> permissions = jdbcTemplate.query(
                "SELECT permission FROM user_permissions WHERE firebase_uid = ? AND tenant_id = ? ORDER BY permission",
                (resultSet, rowNumber) -> resultSet.getString(1),
                firebaseUid, assignment.tenantId()
            );
            if (permissions.isEmpty()) {
                claims.remove("permissions");
            } else {
                claims.put("permissions", permissions);
            }
            try {
                firebaseAuth.setCustomUserClaims(firebaseUid, claims);
            } catch (FirebaseAuthException exception) {
                throw new IllegalStateException("Could not restore Firebase claims for " + firebaseUid, exception);
            }
            jdbcTemplate.update(
                "UPDATE firebase_users SET role = ?, tenant_id = ?, synced_at = NOW() WHERE firebase_uid = ?",
                assignment.role(), assignment.tenantId(), firebaseUid
            );
            fixed++;
        }
        return new BulkFixResult(fixed, skipped.size(), skipped);
    }

    private record RoleAssignment(String role, UUID tenantId) { }
    public record BulkFixResult(int fixed, int skipped, List<String> details) { }

    private RegistrationRequestResponse findRequest(
        CaresyncPrincipal actor,
        UUID requestId,
        UUID requestedTenantId
    ) {
        UUID tenantId = authorizedTenant(actor, requestedTenantId);
        tenantRlsContext.apply(actor, tenantId);
        RegistrationRequestResponse request = jdbcTemplate.query("""
            SELECT id, email, firebase_uid, requested_role, requested_tenant_id, status,
                   submitted_at, reviewed_by, reviewed_at, rejection_reason
            FROM registration_requests
            WHERE id = ?
            """,
            statement -> statement.setObject(1, requestId),
            resultSet -> resultSet.next()
                ? mapRequest(resultSet, 0) : null
        );
        if (request == null) throw new NotFoundException("Registration request not found");
        return request;
    }

    private UUID authorizedTenant(CaresyncPrincipal actor, UUID requestedTenantId) {
        if (actor == null || actor.role() == null) throw new ForbiddenException("Access denied");
        if ("SUPER_ADMIN".equals(actor.role())) return requestedTenantId;
        if (!"TENANT_ADMIN".equals(actor.role()) || actor.tenantId() == null
            || requestedTenantId != null && !requestedTenantId.equals(actor.tenantId())) {
            throw new ForbiddenException("Tenant access denied");
        }
        return actor.tenantId();
    }

    private RegistrationRequestResponse mapRequest(ResultSet resultSet, int rowNumber) throws SQLException {
        Timestamp submittedAt = resultSet.getTimestamp("submitted_at");
        Timestamp reviewedAt = resultSet.getTimestamp("reviewed_at");
        return new RegistrationRequestResponse(
            resultSet.getObject("id", UUID.class),
            resultSet.getString("email"),
            resultSet.getString("firebase_uid"),
            resultSet.getString("requested_role"),
            resultSet.getObject("requested_tenant_id", UUID.class),
            resultSet.getString("status"),
            submittedAt == null ? null : submittedAt.toInstant(),
            resultSet.getString("reviewed_by"),
            reviewedAt == null ? null : reviewedAt.toInstant(),
            resultSet.getString("rejection_reason")
        );
    }

    private static void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
    }

    public record PendingActivationResponse(
        String firebaseUid,
        String email,
        String role,
        UUID tenantId,
        boolean disabled,
        java.time.Instant lastSyncedAt
    ) { }
}
