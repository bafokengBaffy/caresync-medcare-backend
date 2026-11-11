package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.TestPropertySource;
import reactor.core.publisher.Mono;

@SpringBootTest(
    classes = GatewayRouteTest.RouteTestApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@TestPropertySource(properties = "caresync.firebase.enabled=false")
class GatewayRouteTest {
    @Autowired
    private RouteLocator routeLocator;

    @Test
    void routesTenantScopedPatientDocumentVersionsToPatientService() {
        assertTrue(matches(
            "patient-service",
            "/api/v1/tenants/32ec0ac7-8610-4656-9284-19cf47c05f79/patients/"
                + "e043116a-99d7-4601-8204-1cb5627a940a/documents/"
                + "ca95d70d-06fc-4dcf-a39b-807dcbe0f93c/versions"
        ));
    }

    @Test
    void keepsAppointmentAndBillingPathsOnTheirExistingRoutes() {
        assertTrue(matches("clinical-service", "/api/v1/appointments"));
        assertTrue(matches("billing-service", "/api/v1/invoices"));
    }

    @Test
    void routesPublicClinicBookingRequestsToClinicalService() {
        assertTrue(matches("clinical-service", "/api/v1/public/clinics/caresync/appointments"));
    }

    @Test
    void routesAuthenticatedProfileRequestsToPatientService() {
        assertTrue(matches("patient-service", "/api/v1/profile"));
        assertTrue(matches("patient-service", "/api/v1/profile/image"));
    }

    @Test
    void routesPatientSelfServiceRequestsToPatientService() {
        assertTrue(matches("patient-service", "/api/v1/patient/me"));
        assertTrue(matches("patient-service", "/api/v1/patient/me/records"));
    }

    @Test
    void routesClinicalAndBillingControllerPathsToTheirServices() {
        assertTrue(matches("clinical-service", "/api/v1/nursing-assessments"));
        assertTrue(matches("clinical-service", "/api/v1/diagnosis-codes"));
        assertTrue(matches("billing-service", "/api/v1/refunds"));
        assertTrue(matches("billing-service", "/api/v1/medical-aid-claims"));
    }

    private boolean matches(String routeId, String path) {
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get(path).build()
        );
        Boolean matched = routeLocator.getRoutes()
            .filter(route -> routeId.equals(route.getId()))
            .next()
            .flatMap(route -> Mono.from(route.getPredicate().apply(exchange)))
            .block(Duration.ofSeconds(2));
        return Boolean.TRUE.equals(matched);
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @Import(health.caresync.gateway.router.GatewayRouterConfig.class)
    static class RouteTestApplication {
        @Bean
        health.caresync.gateway.config.GatewayTokenVerifier tokenVerifier() {
            return token -> new health.caresync.gateway.config.VerifiedIdentity(
                "test-user",
                "32ec0ac7-8610-4656-9284-19cf47c05f79",
                "ADMIN",
                ""
            );
        }
    }
}
