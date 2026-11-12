package health.caresync.gateway.config;

import health.caresync.gateway.filter.ConsentVerificationFilter;
import health.caresync.gateway.service.PermissionCheckService;
import health.caresync.gateway.service.TokenValidationService;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthGatewayFilter implements GlobalFilter, Ordered {
    private static final Pattern PUBLIC_BOOKING_PATH = Pattern.compile(
        "^/api/v1/public/clinics/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?/appointments$"
    );
    private static final Set<String> ALLOWED_ROLES =
        Set.of(
            "SUPER_ADMIN", "TENANT_ADMIN", "PATIENT", "PROVIDER", "STAFF",
            "RECEPTION", "FINANCE", "MANAGER", "CONSENT_MANAGER", "CLINICIAN",
            "PRIVACY_OFFICER", "RECEPTIONIST"
        );
    private final TokenValidationService tokenValidationService;
    private final PermissionCheckService permissionCheckService;

    @Autowired
    public JwtAuthGatewayFilter(
        TokenValidationService tokenValidationService,
        PermissionCheckService permissionCheckService
    ) {
        this.tokenValidationService = tokenValidationService;
        this.permissionCheckService = permissionCheckService;
    }

    public JwtAuthGatewayFilter(GatewayTokenVerifier tokenVerifier) {
        this(new TokenValidationService(tokenVerifier), new PermissionCheckService());
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
        return tokenValidationService.validate(authorization)
            .flatMap(token -> forwardWithVerifiedClaims(exchange, chain, token))
            .onErrorResume(
                TokenValidationService.TokenInvalidException.class,
                error -> unauthorized(exchange)
            );
    }

    private Mono<Void> forwardWithVerifiedClaims(
        ServerWebExchange exchange,
        GatewayFilterChain chain,
        VerifiedIdentity identity
    ) {
        if (identity == null || identity.userId() == null || identity.userId().isBlank()) {
            return unauthorized(exchange);
        }

        String path = exchange.getRequest().getURI().getPath();
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
        String requiredPermission = requiredPermission(
            path,
            exchange.getRequest().getMethod() == null
                ? null
                : exchange.getRequest().getMethod().name()
        );
        if (requiredPermission != null
            && !permissionCheckService.isAuthorized(identity, requiredPermission, selectedTenantText)) {
            return forbidden(exchange);
        }

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
        exchange.getAttributes().put(ConsentVerificationFilter.VERIFIED_IDENTITY_ATTR, identity);
        return chain.filter(exchange.mutate().request(request).build());
    }

    private String requiredPermission(String path, String method) {
        if (isPathOrChild(path, "/api/v1/payroll")) {
            return "GET".equals(method) || "HEAD".equals(method)
                ? "payroll:read"
                : "payroll:write";
        }
        return null;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    private Mono<Void> badRequest(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        return exchange.getResponse().setComplete();
    }

    private Mono<Void> forbidden(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
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

}
