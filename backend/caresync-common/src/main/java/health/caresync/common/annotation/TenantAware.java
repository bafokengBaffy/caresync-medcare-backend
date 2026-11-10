package health.caresync.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marker annotation for JPA Entities that belong to a specific tenant.
 * OWASP Alignment: Used by Hibernate filters/interceptors to automatically append
 * `tenant_id = ?` to all SQL queries, preventing Cross-Tenant Data Leakage.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface TenantAware {
}
