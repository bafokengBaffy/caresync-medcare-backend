package health.caresync.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to enforce granular Role-Based Access Control (RBAC) on specific methods.
 * OWASP Alignment: Implements Defense in Depth. Even if a request passes the Gateway,
 * this enforces authorization at the method level (e.g., Doctors can read patients, but only Finance can read billing).
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    /**
     * The specific permission string required (e.g., "patients:read", "billing:write").
     */
    String value();
}
