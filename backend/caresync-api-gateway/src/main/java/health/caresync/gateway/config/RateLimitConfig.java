package health.caresync.gateway.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RateLimitConfig {
    private final Cache<String, Bucket> buckets;
    private final int capacity;

    public RateLimitConfig(
        @Value("${caresync.gateway.rate-limit.capacity:120}") int capacity
    ) {
        if (capacity < 1) {
            throw new IllegalArgumentException("Rate-limit capacity must be positive");
        }
        this.capacity = capacity;
        this.buckets = Caffeine.newBuilder()
            .maximumSize(100_000)
            .expireAfterAccess(Duration.ofMinutes(10))
            .build();
    }

    public Bucket bucketFor(String key) {
        return buckets.get(key, ignored -> Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, Duration.ofMinutes(1))
                .build())
            .build());
    }
}
