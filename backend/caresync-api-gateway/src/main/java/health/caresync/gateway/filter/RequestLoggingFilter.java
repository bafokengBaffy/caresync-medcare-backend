package health.caresync.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Set;

/**
 * Structured request logging.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A09 – Logging & Monitoring: structured, correlated, no PII.</li>
 *   <li>A03 – Injection: never log raw user input (path/query/headers) unsanitized.</li>
 *   <li>A02 – Crypto: never log Authorization/Cookie headers.</li>
 * </ul>
 */
@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    private static final String CORRELATION_HEADER = "X-Correlation-Id";

    /** Endpoints excluded from access logs (health probes) to reduce noise/cost. */
    private static final Set<String> SKIP_PATH_PREFIXES = Set.of(
            "/actuator/health", "/actuator/info", "/favicon.ico"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getRawPath();

        if (SKIP_PATH_PREFIXES.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_HEADER);
        String method = exchange.getRequest().getMethod() != null
                ? exchange.getRequest().getMethod().name() : "UNKNOWN";
        String routeId = resolveRouteId(exchange);

        long start = System.nanoTime();

        // Route IDs are gateway-controlled and avoid exposing patient IDs in URL paths.
        return chain.filter(exchange)
                .doOnSuccess(v -> logCompletion(method, routeId, correlationId,
                        exchange.getResponse().getStatusCode(), start))
                .doOnError(err -> {
                    // Log error class only – message could contain secrets (A02/A09).
                    log.warn("request_error method={} route={} correlationId={} errorClass={}",
                            method, sanitize(routeId), sanitize(correlationId), err.getClass().getSimpleName());
                });
    }

    private void logCompletion(String method, String routeId, String correlationId,
                               HttpStatusCode status, long startNanos) {
        long durationMs = (System.nanoTime() - startNanos) / 1_000_000L;
        int statusCode = status != null ? status.value() : 0;

        log.info("http_access method={} route={} status={} durationMs={} correlationId={}",
                method,
                sanitize(routeId),
                statusCode,
                durationMs,
                sanitize(correlationId));

        // Optional: emit security-relevant events for SIEM (A09).
        if (statusCode == 401 || statusCode == 403 || statusCode == 429) {
            log.warn("security_event type=authz_or_rate_limit status={} route={} correlationId={}",
                    statusCode, sanitize(routeId), sanitize(correlationId));
        }
    }

    private String resolveRouteId(ServerWebExchange exchange) {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        return route != null ? route.getId() : "unmatched";
    }

    private static String sanitize(String v) {
        if (v == null) return "-";
        String s = v.replaceAll("[\\r\\n\\t]", "_");
        return s.length() > 128 ? s.substring(0, 128) + "..." : s;
    }

    @Override
    public int getOrder() {
        // After CorrelationIdFilter so correlation ID exists; before auth.
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}