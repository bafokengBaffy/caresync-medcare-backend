package health.caresync.gateway.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RateLimitConfig {
    private final Cache<String, Bucket> buckets;
    private final int defaultRequestsPerMinute;
    private final int burstCapacity;
    private final boolean enabled;

    @Autowired
    public RateLimitConfig(
        @Value("${caresync.gateway.rate-limit.enabled:true}") boolean enabled,
        @Value("${caresync.gateway.rate-limit.default-requests-per-minute:600}") int defaultRequestsPerMinute,
        @Value("${caresync.gateway.rate-limit.burst-capacity:120}") int burstCapacity
    ) {
        if (defaultRequestsPerMinute < 1 || burstCapacity < 1) {
            throw new IllegalArgumentException("Rate-limit values must be positive");
        }
        this.enabled = enabled;
        this.defaultRequestsPerMinute = defaultRequestsPerMinute;
        this.burstCapacity = burstCapacity;
        this.buckets = Caffeine.newBuilder()
            .maximumSize(100_000)
            .expireAfterAccess(Duration.ofMinutes(10))
            .build();
    }

    public RateLimitConfig(int capacity) {
        this(true, capacity, capacity);
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Bucket bucketFor(String key) {
        return buckets.get(key, ignored -> Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(burstCapacity)
                .refillGreedy(defaultRequestsPerMinute, Duration.ofMinutes(1))
                .build())
            .build());
    }
}
