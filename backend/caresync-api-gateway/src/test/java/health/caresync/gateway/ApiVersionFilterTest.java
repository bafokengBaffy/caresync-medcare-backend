package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import health.caresync.gateway.filter.ApiVersionFilter;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

class ApiVersionFilterTest {
    private final ApiVersionFilter filter = new ApiVersionFilter();

    @Test
    void forwardsSupportedPathVersionAsCanonicalHeader() {
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/patients").build()
        );

        filter.filter(exchange, forwardedExchange -> {
            forwarded.set(forwardedExchange);
            return Mono.empty();
        }).block();

        assertEquals("v1", forwarded.get().getRequest().getHeaders().getFirst("X-API-Version"));
    }

    @Test
    void letsHealthProbesAndPreflightRequestsPassWithoutVersionHeaders() {
        AtomicBoolean healthPassed = new AtomicBoolean();
        AtomicBoolean preflightPassed = new AtomicBoolean();
        MockServerWebExchange health = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/actuator/health/liveness").build()
        );
        MockServerWebExchange preflight = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .method(HttpMethod.OPTIONS, "/api/v1/patients").build()
        );

        filter.filter(health, ignored -> {
            healthPassed.set(true);
            return Mono.empty();
        }).block();
        filter.filter(preflight, ignored -> {
            preflightPassed.set(true);
            return Mono.empty();
        }).block();

        assertTrue(healthPassed.get());
        assertTrue(preflightPassed.get());
    }

    @Test
    void rejectsUnroutedVersionsInsteadOfAcceptingThem() {
        AtomicBoolean forwarded = new AtomicBoolean();
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v2/patients").build()
        );

        filter.filter(exchange, ignored -> {
            forwarded.set(true);
            return Mono.empty();
        }).block();

        assertEquals(HttpStatus.NOT_ACCEPTABLE, exchange.getResponse().getStatusCode());
        assertFalse(forwarded.get());
    }
}
