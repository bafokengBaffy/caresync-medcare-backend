package health.caresync.common.cache;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/** Reports Redis availability (degrades gracefully if Redis absent). */
@Component("cacheHealthIndicator")
public class CacheHealthIndicator implements HealthIndicator {

    private final StringRedisTemplate redis;

    public CacheHealthIndicator(@Autowired(required = false) StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public Health health() {
        if (redis == null) return Health.up().withDetail("cache", "disabled").build();
        try {
            String pong = redis.getConnectionFactory().getConnection().ping();
            return "PONG".equals(pong) ? Health.up().build() : Health.down().withDetail("redis", pong).build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}