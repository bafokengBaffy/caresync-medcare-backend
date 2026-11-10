package health.caresync.gateway.config;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {
    @Bean
    public RouteLocator routes(RouteLocatorBuilder b) {
        String patient  = serviceUri(env("PATIENT_SERVICE_URL",  "http://localhost:8081"));
        String clinical = serviceUri(env("CLINICAL_SERVICE_URL", "http://localhost:8082"));
        String laboratory = serviceUri(env("LABORATORY_SERVICE_URL", "http://localhost:8086"));
        String billing  = serviceUri(env("BILLING_SERVICE_URL",  "http://localhost:8083"));
        return b.routes()
            .route("patients",  r -> r.path(
                "/api/v1/patients/**",
                "/api/v1/tenants/*/patients/**",
                "/api/v1/providers/**",
                "/api/v1/admin/**",
                "/api/v1/auth/**",
                "/api/v1/profile/**",
                "/api/v1/patient/me",
                "/api/v1/patient/me/**"
            ).uri(patient))
            .route("clinical",  r -> r.path(
                "/api/v1/appointments/**",
                "/api/v1/public/clinics/*/appointments",
                "/api/v1/notes",
                "/api/v1/notes/**",
                "/api/v1/availability/**",
                "/api/v1/dental-charts",
                "/api/v1/dental-charts/**",
                "/api/v1/eye-exams",
                "/api/v1/eye-exams/**"
            ).uri(clinical))
            .route("laboratory", r -> r.path("/api/v1/lab-results", "/api/v1/lab-results/**").uri(laboratory))
            .route("billing",   r -> r.path("/api/v1/invoices/**", "/api/v1/payments/**").uri(billing))
            .build();
    }
    private static String env(String k, String d) { String v = System.getenv(k); return v == null ? d : v; }
    private static String serviceUri(String value) {
        return value.contains("://") ? value : "https://" + value;
    }
}