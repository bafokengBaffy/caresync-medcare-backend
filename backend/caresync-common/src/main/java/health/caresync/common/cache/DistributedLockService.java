package health.caresync.common.cache;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.UUID;

/** Best-effort distributed lock with token-based release (OWASP A08). */
@Service
public class DistributedLockService {

    private static final DefaultRedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            Long.class);

    private final StringRedisTemplate redis;

    public DistributedLockService(@Autowired(required = false) StringRedisTemplate redis) {
        this.redis = redis;
    }

    public String tryAcquire(String key, Duration ttl) {
        if (redis == null) return null;
        String token = UUID.randomUUID().toString();
        Boolean ok = redis.opsForValue().setIfAbsent(key, token, ttl);
        return Boolean.TRUE.equals(ok) ? token : null;
    }

    public void release(String key, String token) {
        if (redis == null || token == null) return;
        redis.execute(RELEASE_SCRIPT, Collections.singletonList(key), token);
    }
}