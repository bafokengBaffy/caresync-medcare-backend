package health.caresync.gateway.service;

import health.caresync.gateway.config.VerifiedIdentity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * RBAC permission evaluation.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A01 – Broken access control: deny-by-default, explicit permissions.</li>
 *   <li>A04 – Insecure design: roles resolved server-side only; never trust client roles.</li>
 *   <li>A07 – Auth failures: requires a verified identity.</li>
 *   <li>A09 – Logging: deny decisions audited with correlation id.</li>
 * </ul>
 */
@Service
public class PermissionCheckService {

    private static final Logger log = LoggerFactory.getLogger(PermissionCheckService.class);

    /**
     * Immutable RBAC map: role -> set of permissions.
     * Extend as needed; keep it authoritative (never derive from client input).
     */
    private static final Map<String, Set<String>> ROLE_PERMISSIONS = Map.of(
            "SUPER_ADMIN", Set.of(
                    "patient:read", "patient:write", "patient:delete",
                    "clinical:read", "clinical:write",
                    "billing:read", "billing:write",
                    "laboratory:read", "laboratory:write",
                    "appointment:read", "appointment:write",
                    "payroll:read", "payroll:write",
                    "admin:read", "admin:write",
                    "audit:read"),
            "SYSTEM_ADMIN", Set.of(
                    "patient:read", "patient:write", "patient:delete",
                    "clinical:read", "clinical:write",
                    "billing:read", "billing:write",
                    "laboratory:read", "laboratory:write",
                    "appointment:read", "appointment:write",
                    "admin:read", "admin:write",
                    "audit:read"),
            "TENANT_ADMIN", Set.of(
                    "patient:read", "patient:write",
                    "clinical:read", "clinical:write",
                    "billing:read", "billing:write",
                    "appointment:read", "appointment:write",
                    "admin:read",
                    "audit:read"),
            "PROVIDER", Set.of(
                    "patient:read",
                    "clinical:read", "clinical:write",
                    "appointment:read", "appointment:write"),
            "NURSE", Set.of(
                    "patient:read",
                    "clinical:read", "clinical:write",
                    "appointment:read"),
            "RECEPTIONIST", Set.of(
                    "patient:read", "patient:write",
                    "appointment:read", "appointment:write",
                    "billing:read"),
            "FINANCE_OFFICER", Set.of(
                    "patient:read",
                    "billing:read", "billing:write"),
            "LAB_TECHNICIAN", Set.of(
                    "patient:read",
                    "laboratory:read", "laboratory:write"),
            "PATIENT", Set.of(
                    "patient-portal:read")
    );

    /** Platform-level roles allowed to operate cross-tenant. */
    private static final Set<String> PLATFORM_ROLES = Set.of("SUPER_ADMIN", "SYSTEM_ADMIN");

    /**
     * Returns true if the identity is authorized for the given permission
     * within the given target tenant. Deny-by-default.
     */
    public boolean isAuthorized(VerifiedIdentity identity, String permission, String targetTenantId) {
        if (identity == null || permission == null || permission.isBlank()) {
            return false;
        }
        if (identity.roles() == null || identity.roles().isEmpty()) {
            return false;
        }

        // Tenant isolation: non-platform roles may only act on their own tenant (A01).
        if (!isPlatformRole(identity)) {
            if (targetTenantId != null
                    && identity.tenantId() != null
                    && !constantTimeEquals(identity.tenantId(), targetTenantId)) {
                log.warn("rbac_denied reason=tenant_mismatch permission={}", safe(permission));
                return false;
            }
        }

        // Aggregate permissions across all assigned roles (no privilege escalation via role order).
        Set<String> effective = aggregatePermissions(identity.roles());
        boolean granted = effective.contains(permission);

        if (!granted) {
            log.warn("rbac_denied reason=missing_permission permission={}", safe(permission));
        }
        return granted;
    }

    /** Convenience: requires only identity + permission (no tenant context). */
    public boolean isAuthorized(VerifiedIdentity identity, String permission) {
        return isAuthorized(identity, permission, null);
    }

    private Set<String> aggregatePermissions(Set<String> roles) {
        java.util.HashSet<String> out = new java.util.HashSet<>();
        for (String r : roles) {
            if (r == null) continue;
            String role = r.trim().toUpperCase(Locale.ROOT);
            Set<String> perms = ROLE_PERMISSIONS.get(role);
            if (perms != null) out.addAll(perms);
        }
        return Collections.unmodifiableSet(out);
    }

    private boolean isPlatformRole(VerifiedIdentity identity) {
        if (identity.roles() == null) return false;
        for (String r : identity.roles()) {
            if (r != null && PLATFORM_ROLES.contains(r.trim().toUpperCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    /** Constant-time compare to avoid timing side channels on tenant IDs (A04). */
    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] ab = a.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return java.security.MessageDigest.isEqual(ab, bb);
    }

    private static String safe(String v) {
        if (v == null) return "null";
        String s = v.replaceAll("[\\r\\n\\t]", "_");
        return s.length() > 64 ? s.substring(0, 64) + "..." : s;
    }
}