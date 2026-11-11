package health.caresync.gateway.error;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Central circuit-breaker error handler.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A04 – Insecure design: fail-closed, no leak of internal exception messages.</li>
 *   <li>A05 – Security misconfiguration: no stack traces or class names in responses.</li>
 *   <li>A09 – Logging: correlation-id-only logs, sanitized.</li>
 * </ul>
 */
@Component
public class CircuitBreakerErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(CircuitBreakerErrorHandler.class);

    private static final String CORRELATION_HEADER = "X-Correlation-Id";

    public Mono<Void> handle(ServerWebExchange exchange, Throwable error) {
        String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_HEADER);

        if (error instanceof CircuitOpenException
                || error instanceof io.github.resilience4j.circuitbreaker.CallNotPermittedException) {
            // Expected, controlled failure mode.
            log.warn("circuit_breaker_open route={} correlationId={}",
                    routeId(exchange), sanitize(correlationId));
            return write(exchange, HttpStatus.SERVICE_UNAVAILABLE,
                    "circuit_open", "Service temporarily unavailable. Please retry later.",
                    correlationId, "30");
        }

        if (error instanceof java.util.concurrent.TimeoutException) {
            log.warn("circuit_breaker_timeout route={} correlationId={}",
                    routeId(exchange), sanitize(correlationId));
            return write(exchange, HttpStatus.GATEWAY_TIMEOUT,
                    "upstream_timeout", "Upstream service timed out.",
                    correlationId, null);
        }

        // Unexpected failure: log class only (message may contain secrets).
        log.error("circuit_breaker_unhandled route={} correlationId={} errorClass={}",
                routeId(exchange), sanitize(correlationId), error.getClass().getSimpleName());
        return write(exchange, HttpStatus.BAD_GATEWAY,
                "upstream_error", "Upstream service error.",
                correlationId, null);
    }

    private Mono<Void> write(ServerWebExchange exchange, HttpStatus status,
                             String code, String message, String correlationId,
                             String retryAfterSeconds) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            // Cannot write error body; caller should have handled earlier.
            return Mono.empty();
        }
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().setCacheControl("no-store");
        response.getHeaders().set("X-Content-Type-Options", "nosniff");
        if (correlationId != null) {
            response.getHeaders().set(CORRELATION_HEADER, correlationId);
        }
        if (retryAfterSeconds != null) {
            response.getHeaders().set("Retry-After", retryAfterSeconds);
        }

        String body = String.format(
                "{\"error\":\"%s\",\"message\":\"%s\",\"correlationId\":\"%s\"}",
                jsonEscape(code), jsonEscape(message), jsonEscape(correlationId));

        DataBuffer buf = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buf));
    }

    private static String routeId(ServerWebExchange exchange) {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        return route != null ? route.getId() : "unmatched";
    }

    private static String sanitize(String v) {
        if (v == null) return "null";
        String s = v.replaceAll("[\\r\\n\\t]", "_");
        return s.length() > 128 ? s.substring(0, 128) + "..." : s;
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

    /** Controlled failure type thrown by circuit breaker filters. */
    public static class CircuitOpenException extends RuntimeException {
        public CircuitOpenException(String message) {
            super(message);
        }
    }
}