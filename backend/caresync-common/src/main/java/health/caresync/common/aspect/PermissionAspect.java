package health.caresync.common.aspect;

import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.TenantContext;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Aspect to enforce granular method-level permissions.
 * OWASP Alignment: Implements Defense in Depth (BOLA prevention). Even if the Gateway
 * lets a request through, this checks if the specific user role has the required permission.
 */
@Aspect
@Component
public class PermissionAspect {

    private static final Logger log = LoggerFactory.getLogger(PermissionAspect.class);

    // Shared Role-to-Permission mapping (Should ideally be externalized to Redis/DB)
    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.ofEntries(
        Map.entry("SUPER_ADMIN", List.of("admin:read", "admin:write", "audit:read", "settings:manage", "integrations:manage", "users:manage", "tenants:manage")),
        Map.entry("TENANT_ADMIN", List.of("admin:read", "admin:write", "audit:read", "settings:manage", "users:manage")),
        Map.entry("PROVIDER", List.of("patients:read", "patients:write", "providers:read", "appointments:read", "appointments:write", "notes:read", "notes:write")),
        Map.entry("CLINICIAN", List.of("patients:read", "patients:write", "appointments:read", "appointments:write", "notes:read", "notes:write")),
        Map.entry("STAFF", List.of()),
        Map.entry("RECEPTION", List.of("patients:read", "patients:write", "appointments:read", "appointments:write", "billing:read", "billing:write")),
        Map.entry("RECEPTIONIST", List.of("patients:read", "patients:write", "appointments:read", "appointments:write", "billing:read", "billing:write")),
        Map.entry("FINANCE", List.of("billing:read", "billing:write")),
        Map.entry("MANAGER", List.of("appointments:read")),
        Map.entry("CONSENT_MANAGER", List.of("consents:read", "consents:write")),
        Map.entry("PRIVACY_OFFICER", List.of("audit:read", "consents:read")),
        Map.entry("PATIENT", List.of())
    );

    @Before("@annotation(requirePermission)")
    public void checkPermission(JoinPoint joinPoint, RequirePermission requirePermission) {
        String role = TenantContext.getRole();
        String requiredPermission = requirePermission.value();

        if (role == null) {
            throw new ForbiddenException("Access Denied: No role found in context.");
        }

        List<String> permissions = ROLE_PERMISSIONS.get(role.toUpperCase());
        
        if (permissions == null) {
            throw new ForbiddenException("Access Denied: Role '" + role + "' is not recognized.");
        }

        if (!permissions.contains(requiredPermission)) {
            log.warn("SECURITY: User {} with role {} attempted to access method requiring permission '{}'", 
                    TenantContext.getUserId(), role, requiredPermission);
            throw new ForbiddenException("Access Denied: Missing required permission '" + requiredPermission + "'.");
        }
    }
}
