package health.caresync.gateway.filter;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.reactor.circuitbreaker.operator.CircuitBreakerOperator;
import health.caresync.gateway.error.CircuitBreakerErrorHandler;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import reactor.core.publisher.Mono;

/**
 * Circuit breaker for downstream services.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A04 – Insecure design: fail-closed, bounded resources.</li>
 *   <li>A05 – Misconfiguration: explicit thresholds, no unbounded retries.</li>
 *   <li>A09 – Logging: logs state transitions with correlation id, no payloads.</li>
 * </ul>
 */
@Component
public class CircuitBreakerFilter implements GlobalFilter, Ordered {

    private final CircuitBreakerRegistry registry;
    private final CircuitBreakerErrorHandler errorHandler;

    public CircuitBreakerFilter(
        CircuitBreakerRegistry registry,
        CircuitBreakerErrorHandler errorHandler
    ) {
        this.registry = registry;
        this.errorHandler = errorHandler;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String cbName = resolveCircuitBreakerName(exchange);

        CircuitBreaker cb = registry.circuitBreaker(cbName);

        return chain.filter(exchange)
                .transformDeferred(CircuitBreakerOperator.of(cb))
                .onErrorResume(err -> errorHandler.handle(exchange, err));
    }

    private String resolveCircuitBreakerName(ServerWebExchange exchange) {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        return route != null ? route.getId() : "unmatched";
    }

    @Override
    public int getOrder() {
        // After auth, consent, and cache policy; before downstream routing.
        return Ordered.LOWEST_PRECEDENCE - 20;
    }
}