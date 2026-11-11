package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(
    classes = ApiGatewayApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "caresync.firebase.enabled=false",
    "caresync.gateway.allowed-origins=http://localhost:5173",
    "caresync.gateway.consent.enabled=false"
})
class GatewayStartupTest {
    @Autowired
    private RouteLocator routeLocator;

    @Test
    void startsWithTheFiveConfiguredBackendRoutes() {
        Set<String> routeIds = routeLocator.getRoutes()
            .map(route -> route.getId())
            .collectList()
            .block(Duration.ofSeconds(5))
            .stream()
            .collect(Collectors.toSet());

        assertTrue(routeIds.containsAll(Set.of(
            "patient-service",
            "clinical-service",
            "billing-service",
            "laboratory-service",
            "payroll-service"
        )));
    }
}
