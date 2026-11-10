package health.caresync.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import health.caresync.common.security.SecurityConfig;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

class SecurityConfigTest {
    private final SecurityConfig securityConfig = new SecurityConfig();

    @Test
    void allowsOnlyConfiguredOriginsAndTenantAwareRequestHeaders() {
        CorsConfiguration cors = corsConfiguration();

        assertEquals("https://caresync-medcare-9e0a5.web.app", cors.checkOrigin(
            "https://caresync-medcare-9e0a5.web.app"
        ));
        assertEquals("http://localhost:5173", cors.checkOrigin("http://localhost:5173"));
        assertNull(cors.checkOrigin("https://attacker.example"));
        assertTrue(cors.getAllowedHeaders().stream().anyMatch("X-Tenant-Id"::equalsIgnoreCase));
        assertTrue(cors.getAllowedHeaders().contains("X-Request-ID"));
        assertTrue(cors.getExposedHeaders().contains("X-Request-ID"));
        assertTrue(cors.getAllowCredentials());
        assertEquals(3600L, cors.getMaxAge());
    }

    @Test
    void permitsExpectedApiMethodsAndRejectsUnlistedMethods() {
        CorsConfiguration cors = corsConfiguration();

        assertTrue(cors.checkHttpMethod(HttpMethod.GET).contains(HttpMethod.GET));
        assertTrue(cors.checkHttpMethod(HttpMethod.OPTIONS).contains(HttpMethod.OPTIONS));
        assertNull(cors.checkHttpMethod(HttpMethod.TRACE));
    }

    private CorsConfiguration corsConfiguration() {
        HttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/patients");
        return securityConfig.corsConfigurationSource().getCorsConfiguration(request);
    }
}
