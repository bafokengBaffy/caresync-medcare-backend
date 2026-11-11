package health.caresync.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Generates/validates a per-request correlation ID for tracing and audit.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A09 – Logging: every log line carries correlation ID; no PII in MDC.</li>
 *   <li>A03 – Injection: correlation ID strictly validated (UUID format only).</li>
 *   <li>A04 – Insecure design: bounded length prevents log flooding.</li>
 * </ul>
 */
@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(CorrelationIdFilter.class);

    public static final String CORRELATION_HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    /** Strict UUID v4 pattern (client cannot inject arbitrary strings). */
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        String incoming = request.getHeaders().getFirst(CORRELATION_HEADER);
        String correlationId;

        if (incoming != null && UUID_PATTERN.matcher(incoming).matches()) {
            correlationId = incoming;
        } else {
            if (incoming != null) {
                // Do NOT echo invalid client input anywhere (A03/A09).
                log.warn("invalid_correlation_id_received length={}",
                        incoming.length());
            }
            correlationId = UUID.randomUUID().toString();
        }

        final String cid = correlationId;

        // Mutate request: single canonical correlation header, remove any duplicates.
        ServerHttpRequest mutated = request.mutate()
                .headers(h -> {
                    h.set(CORRELATION_HEADER, cid);
                })
                .build();

        ServerWebExchange mutatedExchange = exchange.mutate().request(mutated).build();

        // Mutate response: set header before commit.
        mutatedExchange.getResponse().beforeCommit(() -> {
            mutatedExchange.getResponse().getHeaders().set(CORRELATION_HEADER, cid);
            return Mono.empty();
        });

        return Mono.deferContextual(ctx -> {
                    MDC.put(MDC_KEY, cid);
                    return chain.filter(mutatedExchange)
                            .doFinally(signal -> MDC.remove(MDC_KEY));
                })
                .contextWrite(c -> c)
                .doOnEach(signal -> {
                    if (signal.getType() == SignalType.ON_ERROR) {
                        log.warn("request_failed correlationId={}", cid);
                    }
                });
    }

    @Override
    public int getOrder() {
        // Must run first so all subsequent filters/logs have the correlation ID.
        return Ordered.HIGHEST_PRECEDENCE;
    }
}