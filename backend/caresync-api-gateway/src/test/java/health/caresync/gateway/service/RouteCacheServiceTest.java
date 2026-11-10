package health.caresync.gateway.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import health.caresync.gateway.dto.RouteInfoResponse;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RouteCacheServiceTest {
    private RouteCacheService routeCacheService;

    @BeforeEach
    void setUp() {
        routeCacheService = new RouteCacheService();
    }

    @Test
    void cachesAndRetrievesRouteMetadataByPath() {
        RouteInfoResponse route = route("/api/v1/patients/**");

        routeCacheService.cacheRoute(route.path(), route);

        assertEquals(route, routeCacheService.getRoute(route.path()).orElseThrow());
        assertEquals(1, routeCacheService.estimatedSize());
    }

    @Test
    void rejectsCacheKeyThatDoesNotMatchTheRoutePath() {
        RouteInfoResponse route = route("/api/v1/patients/**");

        assertThrows(
            IllegalArgumentException.class,
            () -> routeCacheService.cacheRoute("/api/v1/invoices/**", route)
        );
        assertTrue(routeCacheService.getRoute(route.path()).isEmpty());
    }

    @Test
    void evictsAndClearsCachedRoutes() {
        RouteInfoResponse route = route("/api/v1/patients/**");
        routeCacheService.cacheRoute(route.path(), route);

        routeCacheService.evictRoute(route.path());
        assertFalse(routeCacheService.getRoute(route.path()).isPresent());

        routeCacheService.cacheRoute(route.path(), route);
        routeCacheService.clear();
        assertTrue(routeCacheService.getRoute(route.path()).isEmpty());
        assertEquals(0, routeCacheService.estimatedSize());
    }

    @Test
    void responseRejectsInvalidMetadata() {
        assertThrows(
            IllegalArgumentException.class,
            () -> new RouteInfoResponse("patients", "patients/**", "patient-service", true, Instant.now())
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> new RouteInfoResponse("patients", "/api/patients\n", "patient-service", true, Instant.now())
        );
    }

    private RouteInfoResponse route(String path) {
        return new RouteInfoResponse(
            "patients",
            path,
            "patient-service",
            true,
            Instant.parse("2026-11-10T12:00:00Z")
        );
    }
}
