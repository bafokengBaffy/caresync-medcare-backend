package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import health.caresync.gateway.config.CorsConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.cors.reactive.CorsWebFilter;
import reactor.core.publisher.Mono;

class CorsTest {
    @Test
    void allowsExplicitOriginForPreflight() {
        CorsWebFilter filter = new CorsConfig().corsWebFilter("https://app.example");
        MockServerWebExchange exchange = preflight("https://app.example");

        filter.filter(exchange, ignored -> Mono.empty()).block();

        assertEquals(
            "https://app.example",
            exchange.getResponse().getHeaders().getFirst("Access-Control-Allow-Origin")
        );
        String allowedHeaders = exchange.getResponse().getHeaders()
            .getFirst("Access-Control-Allow-Headers").toLowerCase();
        assertTrue(allowedHeaders.contains("authorization"));
        assertTrue(allowedHeaders.contains("x-api-version"));
        assertTrue(allowedHeaders.contains("x-correlation-id"));
        assertNull(exchange.getResponse().getHeaders().getFirst("Access-Control-Allow-Credentials"));
    }

    @Test
    void rejectsOriginOutsideTheConfiguredAllowlist() {
        CorsWebFilter filter = new CorsConfig().corsWebFilter("https://app.example");
        MockServerWebExchange exchange = preflight("https://attacker.example");

        filter.filter(exchange, ignored -> Mono.empty()).block();

        assertEquals(403, exchange.getResponse().getStatusCode().value());
        assertNull(exchange.getResponse().getHeaders().getFirst("Access-Control-Allow-Origin"));
    }

    @Test
    void rejectsWildcardOrEmptyAllowlist() {
        CorsConfig config = new CorsConfig();

        assertThrows(IllegalStateException.class, () -> config.corsWebFilter("*"));
        assertThrows(IllegalStateException.class, () -> config.corsWebFilter(" , "));
    }

    private MockServerWebExchange preflight(String origin) {
        return MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .options("https://gateway.local/api/v1/patients")
                .header("Origin", origin)
                .header("Access-Control-Request-Method", "GET")
                .header(
                    "Access-Control-Request-Headers",
                    "authorization,x-tenant-id,x-api-version,x-correlation-id"
                )
                .build()
        );
    }
}
