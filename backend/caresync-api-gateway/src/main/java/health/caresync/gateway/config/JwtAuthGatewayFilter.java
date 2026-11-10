package health.caresync.gateway.config;

import com.google.firebase.auth.FirebaseAuthException;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
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
    private static final Pattern PUBLIC_BOOKING_PATH = Pattern.compile(
        "^/api/v1/public/clinics/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?/appointments$"
    );
    private static final Set<String> ALLOWED_ROLES =
        Set.of(
            "SUPER_ADMIN", "TENANT_ADMIN", "PATIENT", "ADMIN", "PROVIDER", "STAFF",
            "RECEPTION", "FINANCE", "MANAGER", "CONSENT_MANAGER", "CLINICIAN",
            "PRIVACY_OFFICER", "RECEPTIONIST"
        );
    private final GatewayTokenVerifier tokenVerifier;

    public JwtAuthGatewayFilter(GatewayTokenVerifier tokenVerifier) {
        this.tokenVerifier = tokenVerifier;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if ((exchange.getRequest().getMethod() != null
            && exchange.getRequest().getMethod().matches("OPTIONS"))
            || isPublicPath(path, exchange.getRequest().getMethod() != null
                && exchange.getRequest().getMethod().matches("POST"))) {
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
        if (identity == null || identity.userId() == null || identity.userId().isBlank()) {
            return unauthorized(exchange);
        }

        String tenantText = identity.tenantId();
        String role = identity.role();
        boolean platformAdmin = "SUPER_ADMIN".equals(role);
        if (role == null || !ALLOWED_ROLES.contains(role)
            || platformAdmin && tenantText != null
            || !platformAdmin && tenantText == null) {
            return unauthorized(exchange);
        }

        String selectedTenantText = tenantText;
        if (platformAdmin) {
            selectedTenantText = exchange.getRequest().getHeaders().getFirst("X-Tenant-Id");
        }

        UUID tenantId = null;
        if (selectedTenantText != null && !selectedTenantText.isBlank()) {
            try {
                tenantId = UUID.fromString(selectedTenantText);
            } catch (IllegalArgumentException exception) {
                return badRequest(exchange);
            }
        }

        UUID verifiedTenantId = tenantId;
        String specialty = identity.specialty() == null ? "" : identity.specialty();
        var request = exchange.getRequest().mutate().headers(headers -> {
            headers.remove("X-Tenant-Id");
            headers.remove("X-User-Id");
            headers.remove("X-Role");
            headers.remove("X-Specialty");
            if (verifiedTenantId != null) headers.set("X-Tenant-Id", verifiedTenantId.toString());
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

    private Mono<Void> badRequest(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        return exchange.getResponse().setComplete();
    }

    private boolean isPublicPath(String path, boolean isPost) {
        return isPathOrChild(path, "/actuator/health")
            || isPathOrChild(path, "/v3/api-docs")
            || path.equals("/swagger-ui.html")
            || isPathOrChild(path, "/swagger-ui")
            || path.equals("/api/v1/auth/sync")
            || path.equals("/api/v1/auth/pending-status")
            || isPost && PUBLIC_BOOKING_PATH.matcher(path).matches();
    }

    private boolean isPathOrChild(String path, String publicPath) {
        return path.equals(publicPath) || path.startsWith(publicPath + "/");
    }

    @Override
    public int getOrder() {
        return -10;
    }

    private static final class InvalidBearerTokenException extends RuntimeException {
        private static final long serialVersionUID = 1L;
    }
}
