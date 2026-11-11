package health.caresync.common.cache;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

/** Bulk eviction by pattern (used on tenant data changes). */
@Service
public class CacheEvictionService {

    private final StringRedisTemplate redis;

    public CacheEvictionService(@Autowired(required = false) StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void evictPattern(String pattern) {
        if (redis == null || pattern == null) return;
        Set<String> keys = redis.keys(pattern);
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
    }
}