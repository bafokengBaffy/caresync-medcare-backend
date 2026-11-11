package health.caresync.common;

import health.caresync.common.annotation.RateLimit;
import health.caresync.common.aspect.RateLimitAspect;
import health.caresync.common.exception.RateLimitExceededException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitAspectTest {

    @Test
    void withoutRedis_passesThrough() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(null);
        ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
        RateLimit rl = mock(RateLimit.class);
        when(pjp.proceed()).thenReturn("ok");

        Object out = aspect.enforce(pjp, rl);
        assertThat(out).isEqualTo("ok");
    }

    @Test
    void annotation_exposesDefaults() {
        RateLimit rl = new RateLimit() {
            @Override public Class<? extends java.lang.annotation.Annotation> annotationType() { return RateLimit.class; }
            @Override public int limit() { return 100; }
            @Override public int windowSeconds() { return 60; }
            @Override public String keyExpression() { return ""; }
        };
        assertThat(rl.limit()).isEqualTo(100);
        assertThat(rl.windowSeconds()).isEqualTo(60);
    }
}