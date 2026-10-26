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
        String rid = UUID.randomUUID().toString();
        var r = ex.getRequest().mutate().header("X-Request-Id", rid).build();
        ex.getResponse().getHeaders().add("X-Request-Id", rid);
        return chain.filter(ex.mutate().request(r).build());
    }
    @Override public int getOrder() { return -20; }
}