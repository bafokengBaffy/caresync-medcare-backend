package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import health.caresync.gateway.config.JwtAuthGatewayFilter;
import health.caresync.gateway.config.VerifiedIdentity;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

class JwtFilterTest {
    @Test
    void requiresBearerTokenForProtectedRoutes() {
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("user-1", UUID.randomUUID().toString(), "ADMIN", "")
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/patients").build()
        );

        filter.filter(exchange, ignored -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void forwardsOnlyVerifiedTenantAndRoleClaims() {
        UUID tenantId = UUID.randomUUID();
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token -> {
            assertEquals("valid-token", token);
            return new VerifiedIdentity("verified-user", tenantId.toString(), "ADMIN", "CARDIOLOGY");
        });
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/patients")
                .header("Authorization", "Bearer valid-token")
                .header("X-Tenant-Id", UUID.randomUUID().toString())
                .header("X-User-Id", "spoofed-user")
                .header("X-Role", "ADMIN")
                .build()
        );

        filter.filter(exchange, forwardedExchange -> {
            forwarded.set(forwardedExchange);
            return Mono.empty();
        }).block();

        assertNotNull(forwarded.get());
        assertEquals(tenantId.toString(), forwarded.get().getRequest().getHeaders().getFirst("X-Tenant-Id"));
        assertEquals("verified-user", forwarded.get().getRequest().getHeaders().getFirst("X-User-Id"));
        assertEquals("ADMIN", forwarded.get().getRequest().getHeaders().getFirst("X-Role"));
        assertEquals("CARDIOLOGY", forwarded.get().getRequest().getHeaders().getFirst("X-Specialty"));
    }

    @Test
    void rejectsUnrecognizedRoleClaims() {
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("verified-user", UUID.randomUUID().toString(), "SUPERUSER", "")
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/patients")
                .header("Authorization", "Bearer valid-token")
                .build()
        );

        filter.filter(exchange, forwardedExchange -> {
            forwarded.set(forwardedExchange);
            return Mono.empty();
        }).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        assertNull(forwarded.get());
    }

    @Test
    void doesNotAllowProtectedPathsThatOnlyStartWithPublicHealthPath() {
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("user-1", UUID.randomUUID().toString(), "ADMIN", "")
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/actuator/health-private").build()
        );

        filter.filter(exchange, ignored -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }
}