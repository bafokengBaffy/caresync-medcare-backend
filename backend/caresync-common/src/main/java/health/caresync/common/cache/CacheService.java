package health.caresync.common.cache;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/** Thin, null-safe cache facade. */
@Service
public class CacheService {

    private final StringRedisTemplate redis;

    public CacheService(@Autowired(required = false) StringRedisTemplate redis) {
        this.redis = redis;
    }

    public String get(String key) {
        return redis == null ? null : redis.opsForValue().get(key);
    }

    public void put(String key, String value, Duration ttl) {
        if (redis != null && value != null) redis.opsForValue().set(key, value, ttl);
    }

    public void evict(String key) {
        if (redis != null && key != null) redis.delete(key);
    }
}