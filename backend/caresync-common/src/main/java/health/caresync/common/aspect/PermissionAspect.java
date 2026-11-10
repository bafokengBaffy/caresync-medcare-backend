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
    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.of(
        "SUPER_ADMIN", List.of("*"),
        "TENANT_ADMIN", List.of("patients:read", "patients:write", "billing:read", "billing:write", "admin:read"),
        "DOCTOR", List.of("patients:read", "clinical:read", "clinical:write", "notes:read", "notes:write"),
        "NURSE", List.of("patients:read", "clinical:read", "nursing:write", "notes:read"),
        "RECEPTIONIST", List.of("patients:read", "patients:create", "appointments:read", "appointments:write", "billing:create"),
        "FINANCE_OFFICER", List.of("billing:read", "billing:write", "invoices:read", "payments:read")
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

        if (permissions.contains("*")) {
            return; // Super Admin bypass
        }

        if (!permissions.contains(requiredPermission)) {
            log.warn("SECURITY: User {} with role {} attempted to access method requiring permission '{}'", 
                    TenantContext.getUserId(), role, requiredPermission);
            throw new ForbiddenException("Access Denied: Missing required permission '" + requiredPermission + "'.");
        }
    }
}
