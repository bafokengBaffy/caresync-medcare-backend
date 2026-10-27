package health.caresync.gateway.filter;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.UUID;

@Component
public class RequestIdGatewayFilter implements GlobalFilter, Ordered {
    @Override public Mono<Void> filter(ServerWebExchange ex, GatewayFilterChain chain) {
        String rid = validRequestId(ex.getRequest().getHeaders().getFirst("X-Request-Id"))
            ? ex.getRequest().getHeaders().getFirst("X-Request-Id")
            : validRequestId(ex.getRequest().getHeaders().getFirst("X-Correlation-Id"))
                ? ex.getRequest().getHeaders().getFirst("X-Correlation-Id")
                : UUID.randomUUID().toString();
        var r = ex.getRequest().mutate().headers(headers -> headers.set("X-Request-Id", rid)).build();
        ex.getResponse().getHeaders().set("X-Request-Id", rid);
        return chain.filter(ex.mutate().request(r).build());
    }

    private boolean validRequestId(String requestId) {
        return requestId != null && requestId.matches("[A-Za-z0-9._-]{1,128}");
    }

    @Override public int getOrder() { return -20; }
}