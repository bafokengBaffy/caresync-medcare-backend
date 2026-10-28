package health.caresync.gateway.config;

import com.google.firebase.auth.FirebaseAuthException;
import java.util.Set;
import java.util.UUID;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
public class JwtAuthGatewayFilter implements GlobalFilter, Ordered {
    private static final Set<String> ALLOWED_ROLES =
        Set.of("ADMIN", "PROVIDER", "STAFF", "RECEPTION", "FINANCE", "MANAGER");
    private final GatewayTokenVerifier tokenVerifier;

    public JwtAuthGatewayFilter(GatewayTokenVerifier tokenVerifier) {
        this.tokenVerifier = tokenVerifier;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (exchange.getRequest().getMethod() != null
            && exchange.getRequest().getMethod().matches("OPTIONS")
            || path.startsWith("/actuator/health")
            || path.startsWith("/v3/api-docs")
            || path.startsWith("/swagger-ui")
            || path.equals("/api/v1/auth/sync")) {
            return chain.filter(exchange);
        }

        String authorization = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() == 7) {
            return unauthorized(exchange);
        }

        return Mono.fromCallable(() -> tokenVerifier.verify(authorization.substring(7)))
            .subscribeOn(Schedulers.boundedElastic())
            .onErrorMap(error -> error instanceof FirebaseAuthException
                || error instanceof IllegalStateException
                ? new InvalidBearerTokenException()
                : error)
            .flatMap(token -> forwardWithVerifiedClaims(exchange, chain, token))
            .onErrorResume(InvalidBearerTokenException.class, error -> unauthorized(exchange));
    }

    private Mono<Void> forwardWithVerifiedClaims(
        ServerWebExchange exchange,
        GatewayFilterChain chain,
        VerifiedIdentity identity
    ) {
        String tenantText = identity.tenantId();
        String role = identity.role();
        if (tenantText == null
            || role == null
            || !ALLOWED_ROLES.contains(role)) {
            return unauthorized(exchange);
        }

        UUID tenantId;
        try {
            tenantId = UUID.fromString(tenantText);
        } catch (IllegalArgumentException exception) {
            return unauthorized(exchange);
        }

        String specialty = identity.specialty();
        var request = exchange.getRequest().mutate().headers(headers -> {
            headers.remove("X-Tenant-Id");
            headers.remove("X-User-Id");
            headers.remove("X-Role");
            headers.remove("X-Specialty");
            headers.set("X-Tenant-Id", tenantId.toString());
            headers.set("X-User-Id", identity.userId());
            headers.set("X-Role", role);
            headers.set("X-Specialty", specialty);
        }).build();
        return chain.filter(exchange.mutate().request(request).build());
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -10;
    }

    private static final class InvalidBearerTokenException extends RuntimeException {
        private static final long serialVersionUID = 1L;
    }
}
