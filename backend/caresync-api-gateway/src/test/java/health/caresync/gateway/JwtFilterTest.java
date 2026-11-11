package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

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
        VerifiedIdentity verifiedIdentity =
            new VerifiedIdentity("verified-user", tenantId.toString(), "ADMIN", "CARDIOLOGY");
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token -> {
            assertEquals("valid-token", token);
            return verifiedIdentity;
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
        assertSame(
            verifiedIdentity,
            forwarded.get().getAttribute(
                health.caresync.gateway.filter.ConsentVerificationFilter.VERIFIED_IDENTITY_ATTR
            )
        );
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
    void forwardsSelectedTenantOnlyForVerifiedSuperAdmin() {
        UUID selectedTenantId = UUID.randomUUID();
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("platform-admin", null, "SUPER_ADMIN", "")
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/admin/users")
                .header("Authorization", "Bearer valid-token")
                .header("X-Tenant-Id", selectedTenantId.toString())
                .build()
        );

        filter.filter(exchange, forwardedExchange -> {
            forwarded.set(forwardedExchange);
            return Mono.empty();
        }).block();

        assertNotNull(forwarded.get());
        assertEquals(
            selectedTenantId.toString(),
            forwarded.get().getRequest().getHeaders().getFirst("X-Tenant-Id")
        );
        assertEquals("SUPER_ADMIN", forwarded.get().getRequest().getHeaders().getFirst("X-Role"));
    }

    @Test
    void rejectsMalformedSelectedTenantForSuperAdmin() {
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("platform-admin", null, "SUPER_ADMIN", "")
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/patients")
                .header("Authorization", "Bearer valid-token")
                .header("X-Tenant-Id", "not-a-uuid")
                .build()
        );

        filter.filter(exchange, forwardedExchange -> {
            forwarded.set(forwardedExchange);
            return Mono.empty();
        }).block();

        assertEquals(HttpStatus.BAD_REQUEST, exchange.getResponse().getStatusCode());
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

    @Test
    void allowsAnonymousPostOnlyToTheExactPublicClinicBookingPath() {
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("unused", UUID.randomUUID().toString(), "PATIENT", "")
        );
        MockServerWebExchange booking = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .post("/api/v1/public/clinics/caresync/appointments").build()
        );

        filter.filter(booking, ignored -> Mono.empty()).block();

        assertNull(booking.getResponse().getStatusCode());
    }

    @Test
    void keepsOtherMethodsAndMalformedPublicClinicSlugsProtected() {
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("unused", UUID.randomUUID().toString(), "PATIENT", "")
        );
        MockServerWebExchange getBooking = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/public/clinics/caresync/appointments").build()
        );
        MockServerWebExchange malformedSlug = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .post("/api/v1/public/clinics/../appointments").build()
        );

        filter.filter(getBooking, ignored -> Mono.empty()).block();
        filter.filter(malformedSlug, ignored -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, getBooking.getResponse().getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, malformedSlug.getResponse().getStatusCode());
    }

    @Test
    void restrictsPayrollToIdentitiesWithPayrollPermissions() {
        UUID tenantId = UUID.randomUUID();
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("tenant-admin", tenantId.toString(), "TENANT_ADMIN", "")
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/payroll/reports")
                .header("Authorization", "Bearer valid-token")
                .build()
        );

        filter.filter(exchange, ignored -> Mono.empty()).block();

        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
    }

    @Test
    void allowsVerifiedSuperAdminsToAccessPayroll() {
        UUID tenantId = UUID.randomUUID();
        JwtAuthGatewayFilter filter = new JwtAuthGatewayFilter(token ->
            new VerifiedIdentity("platform-admin", null, "SUPER_ADMIN", "")
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/payroll/reports")
                .header("Authorization", "Bearer valid-token")
                .header("X-Tenant-Id", tenantId.toString())
                .build()
        );
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();

        filter.filter(exchange, forwardedExchange -> {
            forwarded.set(forwardedExchange);
            return Mono.empty();
        }).block();

        assertEquals(tenantId.toString(), forwarded.get().getRequest().getHeaders().getFirst("X-Tenant-Id"));
    }
}