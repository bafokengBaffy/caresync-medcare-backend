package health.caresync.common.annotation;

import java.lang.annotation.*;

/** Token-bucket rate limit for an endpoint. */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {
    /** Maximum requests per window. */
    int limit() default 100;
    /** Window size in seconds. */
    int windowSeconds() default 60;
    /** Key SpEL (default: principal + method). */
    String keyExpression() default "";
}