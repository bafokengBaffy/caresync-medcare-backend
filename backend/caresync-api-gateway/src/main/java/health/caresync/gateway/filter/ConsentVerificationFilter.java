package health.caresync.gateway.filter;

import health.caresync.gateway.config.VerifiedIdentity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * Verifies that the caller has valid consent for PHI-bearing endpoints.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A01 – Broken access control: fail-closed on missing consent.</li>
 *   <li>A02 – Cryptographic failures: relies on verified JWT claims only.</li>
 *   <li>A07 – Auth failures: requires authenticated identity.</li>
 *   <li>A09 – Logging: audit-safe consent denials.</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(name = "caresync.gateway.consent.enabled", havingValue = "true")
public class ConsentVerificationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(ConsentVerificationFilter.class);

    private static final String CORRELATION_HEADER = "X-Correlation-Id";

    /** Attribute set by JwtAuthGatewayFilter after token validation. */
    public static final String VERIFIED_IDENTITY_ATTR = "caresync.verifiedIdentity";

    /** Paths that require patient consent (PHI/PII). */
    private final Set<String> consentRequiredPrefixes;

    /** Paths exempt from consent (public/meta/auth endpoints). */
    private static final Set<String> PUBLIC_PREFIXES = Set.of(
            "/actuator/health",
            "/actuator/info",
            "/api/v1/auth",
            "/api/v1/public",
            "/v3/api-docs",
            "/swagger-ui"
    );

    /** Allowed roles that may access PHI only when consent is present. */
    private static final Set<String> CONSENT_EXEMPT_ROLES = Set.of(
            "SUPER_ADMIN"
    );

    public ConsentVerificationFilter(
            @Value("${caresync.gateway.consent.enforce-on-prefixes:/api/v1/clinical,/api/v1/patients,/api/v1/appointments,/api/v1/billing,/api/v1/laboratory,/api/v1/notes}")
            List<String> consentRequiredPrefixes) {
        this.consentRequiredPrefixes = Set.copyOf(consentRequiredPrefixes);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        String correlationId = request.getHeaders().getFirst(CORRELATION_HEADER);

        if (isPublic(path)) {
            return chain.filter(exchange);
        }

        if (!requiresConsent(path)) {
            return chain.filter(exchange);
        }

        // Identity must have been verified by an earlier auth filter (A07).
        Object identityAttr = exchange.getAttributes().get(VERIFIED_IDENTITY_ATTR);
        if (!(identityAttr instanceof VerifiedIdentity identity)) {
            log.warn("consent_denied reason=unauthenticated correlationId={}", sanitize(correlationId));
            return writeError(exchange, HttpStatus.UNAUTHORIZED,
                    "Authentication required.", correlationId, "unauthenticated");
        }

        // System admins bypass patient consent (they operate at platform level).
        if (identity.roles() != null && identity.roles().stream().anyMatch(CONSENT_EXEMPT_ROLES::contains)) {
            return chain.filter(exchange);
        }

        // Patient-scoped consent must be present and valid.
        if (!hasValidConsent(identity)) {
            log.warn("consent_denied reason=missing_or_expired correlationId={}",
                    sanitize(correlationId));
            return writeError(exchange, HttpStatus.FORBIDDEN,
                    "Patient consent required for this resource.", correlationId, "consent_required");
        }

        // Propagate consent metadata downstream as trusted headers (not client-controllable).
        ServerHttpRequest mutated = request.mutate()
                .headers(h -> {
                    h.set("X-Consent-Verified", "true");
                    h.set("X-Consent-Version", String.valueOf(identity.consentVersion()));
                })
                .build();

        return chain.filter(exchange.mutate().request(mutated).build());
    }

    private boolean isPublic(String path) {
        return PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private boolean requiresConsent(String path) {
        return consentRequiredPrefixes.stream().anyMatch(path::startsWith);
    }

    /**
     * Consent validity is derived ONLY from verified JWT claims
     * (never from query params or client headers).
     */
    private boolean hasValidConsent(VerifiedIdentity identity) {
        if (identity.consentGranted() == null || !identity.consentGranted()) {
            return false;
        }
        if (identity.consentExpiresAt() == null) {
            return false;
        }
        // Bounded skew of 30s; reject expired consent (A01/A07).
        long now = java.time.Instant.now().getEpochSecond();
        return identity.consentExpiresAt() > (now - 30);
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status,
                                  String message, String correlationId, String code) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().setCacheControl("no-store");
        if (correlationId != null) response.getHeaders().set(CORRELATION_HEADER, correlationId);
        String body = String.format(
                "{\"error\":\"%s\",\"message\":\"%s\",\"correlationId\":\"%s\"}",
                jsonEscape(code), jsonEscape(message), jsonEscape(correlationId));
        DataBuffer buf = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buf));
    }

    private static String sanitize(String v) {
        if (v == null) return "null";
        return v.replaceAll("[\\r\\n\\t]", "_");
    }

    private static String jsonEscape(String v) {
        if (v == null) return "";
        StringBuilder sb = new StringBuilder(v.length() + 8);
        for (char c : v.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        return sb.toString();
    }

    @Override
    public int getOrder() {
        // After auth (JwtAuthGatewayFilter), before routing.
        return Ordered.LOWEST_PRECEDENCE - 40;
    }
}
