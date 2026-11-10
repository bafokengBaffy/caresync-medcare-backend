package health.caresync.gateway.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import health.caresync.gateway.dto.RouteInfoResponse;
import java.time.Duration;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class RouteCacheService {
    private static final long MAXIMUM_ROUTE_ENTRIES = 512;
    private static final Duration ROUTE_TTL = Duration.ofMinutes(5);

    private final Cache<String, RouteInfoResponse> routeCache = Caffeine.newBuilder()
        .maximumSize(MAXIMUM_ROUTE_ENTRIES)
        .expireAfterWrite(ROUTE_TTL)
        .build();

    public void cacheRoute(String path, RouteInfoResponse routeInfo) {
        Objects.requireNonNull(routeInfo, "routeInfo is required");
        if (!Objects.equals(path, routeInfo.path())) {
            throw new IllegalArgumentException("Cache key must match the route path");
        }
        routeCache.put(path, routeInfo);
    }

    public Optional<RouteInfoResponse> getRoute(String path) {
        if (path == null || path.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(routeCache.getIfPresent(path));
    }

    public void evictRoute(String path) {
        if (path != null && !path.isBlank()) {
            routeCache.invalidate(path);
        }
    }

    public void clear() {
        routeCache.invalidateAll();
    }

    public long estimatedSize() {
        return routeCache.estimatedSize();
    }
}