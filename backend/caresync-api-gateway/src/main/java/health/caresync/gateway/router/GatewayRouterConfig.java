package health.caresync.gateway.router;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.time.Duration;

import health.caresync.gateway.util.RouteUtils;

/**
 * Gateway routing configuration.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A01 – Broken access control: explicit allow-listed route paths, no wildcards to internal nets.</li>
 *   <li>A05 – Security misconfiguration: bounded timeouts, no direct internal host exposure.</li>
 *   <li>A10 – SSRF: downstream URIs are fixed config values, never derived from user input.</li>
 * </ul>
 *
 * <p>All downstream URIs MUST come from environment/config, never from headers or paths.
 */
@Configuration
public class GatewayRouterConfig {

    private static final Logger log = LoggerFactory.getLogger(GatewayRouterConfig.class);

    // ---- Service URIs (externalized; never user-controlled) ----
    @Value("${caresync.services.patient.uri:${PATIENT_SERVICE_URL:http://localhost:8081}}")
    private String patientServiceUri;

    @Value("${caresync.services.clinical.uri:${CLINICAL_SERVICE_URL:http://localhost:8082}}")
    private String clinicalServiceUri;

    @Value("${caresync.services.billing.uri:${BILLING_SERVICE_URL:http://localhost:8083}}")
    private String billingServiceUri;

    @Value("${caresync.services.laboratory.uri:${LABORATORY_SERVICE_URL:http://localhost:8084}}")
    private String laboratoryServiceUri;

    @Value("${caresync.services.payroll.uri:${PAYROLL_SERVICE_URL:http://localhost:8085}}")
    private String payrollServiceUri;

    // ---- Bounded timeouts (A04/A05) ----
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(15);

    @Bean
    public RouteLocator caresyncRoutes(RouteLocatorBuilder builder) {
        log.info("gateway_routes_initializing");

        return builder.routes()

                // --- Patient service ---
                .route("patient-service", r -> r
                        .path("/api/v1/patients", "/api/v1/patients/**",
                              "/api/v1/tenants/**", "/api/v1/patient-portal/**",
                              "/api/v1/patient/me", "/api/v1/patient/me/**",
                              "/api/v1/admin/**", "/api/v1/providers", "/api/v1/providers/**",
                              "/api/v1/auth/**", "/api/v1/profile/**")
                        .filters(f -> f
                                .stripPrefix(0)
                                .removeRequestHeader("X-Internal-Service")
                                .removeRequestHeader("X-Gateway-Route")
                                .addRequestHeader("X-Gateway-Route", "patient-service"))
                        .metadata("connect-timeout", CONNECT_TIMEOUT.toMillis())
                        .metadata("response-timeout", RESPONSE_TIMEOUT.toMillis())
                        .uri(validatedServiceUri(patientServiceUri)))

                // --- Clinical service ---
                .route("clinical-service", r -> r
                        .path("/api/v1/appointments", "/api/v1/appointments/**",
                              "/api/v1/public/clinics/*/appointments",
                              "/api/v1/clinical/**", "/api/v1/notes", "/api/v1/notes/**",
                              "/api/v1/clinical-notes/**", "/api/v1/availability/**",
                              "/api/v1/dental-charts", "/api/v1/dental-charts/**",
                              "/api/v1/eye-exams", "/api/v1/eye-exams/**",
                              "/api/v1/diagnosis-codes", "/api/v1/diagnosis-codes/**",
                              "/api/v1/nursing-assessments", "/api/v1/nursing-assessments/**",
                              "/api/v1/mental-health-assessments",
                              "/api/v1/mental-health-assessments/**",
                              "/api/v1/analytics/clinical-data", "/api/v1/analytics/clinical-data/**")
                        .filters(f -> f
                                .stripPrefix(0)
                                .removeRequestHeader("X-Internal-Service")
                                .removeRequestHeader("X-Gateway-Route")
                                .addRequestHeader("X-Gateway-Route", "clinical-service"))
                        .metadata("connect-timeout", CONNECT_TIMEOUT.toMillis())
                        .metadata("response-timeout", RESPONSE_TIMEOUT.toMillis())
                        .uri(validatedServiceUri(clinicalServiceUri)))

                // --- Billing service ---
                .route("billing-service", r -> r
                        .path("/api/v1/billing/**", "/api/v1/invoices", "/api/v1/invoices/**",
                              "/api/v1/payments", "/api/v1/payments/**",
                              "/api/v1/refunds", "/api/v1/refunds/**",
                              "/api/v1/sliding-scale/**", "/api/v1/service-fees",
                              "/api/v1/service-fees/**", "/api/v1/medical-aid-claims",
                              "/api/v1/medical-aid-claims/**")
                        .filters(f -> f
                                .stripPrefix(0)
                                .removeRequestHeader("X-Internal-Service")
                                .removeRequestHeader("X-Gateway-Route")
                                .addRequestHeader("X-Gateway-Route", "billing-service"))
                        .metadata("connect-timeout", CONNECT_TIMEOUT.toMillis())
                        .metadata("response-timeout", RESPONSE_TIMEOUT.toMillis())
                        .uri(validatedServiceUri(billingServiceUri)))

                // --- Laboratory service ---
                .route("laboratory-service", r -> r
                        .path("/api/v1/laboratory/**", "/api/v1/lab-results",
                              "/api/v1/lab-results/**")
                        .filters(f -> f
                                .stripPrefix(0)
                                .removeRequestHeader("X-Internal-Service")
                                .removeRequestHeader("X-Gateway-Route")
                                .addRequestHeader("X-Gateway-Route", "laboratory-service"))
                        .metadata("connect-timeout", CONNECT_TIMEOUT.toMillis())
                        .metadata("response-timeout", RESPONSE_TIMEOUT.toMillis())
                        .uri(validatedServiceUri(laboratoryServiceUri)))

                // --- Payroll service (admin-only; enforced by PermissionCheckService) ---
                .route("payroll-service", r -> r
                        .path("/api/v1/payroll/**")
                        .filters(f -> f
                                .stripPrefix(0)
                                .removeRequestHeader("X-Internal-Service")
                                .removeRequestHeader("X-Gateway-Route")
                                .addRequestHeader("X-Gateway-Route", "payroll-service"))
                        .metadata("connect-timeout", CONNECT_TIMEOUT.toMillis())
                        .metadata("response-timeout", RESPONSE_TIMEOUT.toMillis())
                        .uri(validatedServiceUri(payrollServiceUri)))

                .build();
    }

    private static String validatedServiceUri(String value) {
        String normalized = value.contains("://") ? value : "https://" + value;
        URI uri;
        try {
            uri = URI.create(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Invalid downstream service URI", ex);
        }
        if (!RouteUtils.isSafeDownstreamUri(uri) || uri.getHost() == null || uri.getUserInfo() != null) {
            throw new IllegalStateException("Downstream service URI must use HTTP or HTTPS and include a host");
        }
        return uri.toString();
    }
}