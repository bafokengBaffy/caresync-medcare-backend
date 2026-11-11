package health.caresync.common.annotation;

import java.lang.annotation.*;

/** Enforces that the request's tenant matches the authenticated principal. */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ValidateTenant {
    /** Header to read the tenant from (default: X-Tenant-Id). */
    String headerName() default "X-Tenant-Id";
}