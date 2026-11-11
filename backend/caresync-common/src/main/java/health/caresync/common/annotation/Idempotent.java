package health.caresync.common.annotation;

import java.lang.annotation.*;

/** Ensures a write is executed at most once per idempotency key. */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Idempotent {
    String headerName() default "Idempotency-Key";
    long ttlSeconds() default 86400;
}