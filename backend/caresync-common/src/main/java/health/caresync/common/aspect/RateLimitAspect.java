package health.caresync.common.aspect;

import health.caresync.common.annotation.RateLimit;
import health.caresync.common.exception.RateLimitExceededException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Redis-backed token-bucket rate limiter (OWASP A04 DoS resistance). */
@Aspect
@Component
public class RateLimitAspect {

    private final StringRedisTemplate redis;

    public RateLimitAspect(@Autowired(required = false) StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Around("@annotation(rateLimit)")
    public Object enforce(ProceedingJoinPoint pjp, RateLimit rateLimit) throws Throwable {
        if (redis == null) return pjp.proceed();
        String key = "rl:" + pjp.getSignature().toShortString();
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, Duration.ofSeconds(rateLimit.windowSeconds()));
        }
        if (count != null && count > rateLimit.limit()) {
            throw new RateLimitExceededException("Rate limit exceeded");
        }
        return pjp.proceed();
    }
}