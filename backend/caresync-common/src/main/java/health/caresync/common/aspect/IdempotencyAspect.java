package health.caresync.common.aspect;

import health.caresync.common.annotation.Idempotent;
import health.caresync.common.exception.ConflictException;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;

/** Prevents duplicate writes via idempotency key (OWASP A08). */
@Aspect
@Component
public class IdempotencyAspect {

    private final StringRedisTemplate redis;

    public IdempotencyAspect(@Autowired(required = false) StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Around("@annotation(idempotent)")
    public Object enforce(ProceedingJoinPoint pjp, Idempotent idempotent) throws Throwable {
        HttpServletRequest req = currentRequest();
        if (req == null || redis == null) {
            return pjp.proceed();   // degrade gracefully
        }
        String key = req.getHeader(idempotent.headerName());
        if (key == null || key.isBlank()) {
            return pjp.proceed();
        }
        String redisKey = "idem:" + pjp.getSignature().toShortString() + ":" + key;
        Boolean acquired = redis.opsForValue().setIfAbsent(redisKey, "1",
                Duration.ofSeconds(idempotent.ttlSeconds()));
        if (Boolean.FALSE.equals(acquired)) {
            throw new ConflictException("Duplicate request detected");
        }
        try {
            return pjp.proceed();
        } catch (Throwable t) {
            // On failure, release so caller can retry
            try { redis.delete(redisKey); } catch (Exception ignored) {}
            throw t;
        }
    }

    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) return sra.getRequest();
        return null;
    }
}