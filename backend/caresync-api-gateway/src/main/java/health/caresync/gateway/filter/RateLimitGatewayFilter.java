package health.caresync.gateway.filter;
import io.github.bucket4j.Bucket;
import health.caresync.gateway.config.RateLimitConfig;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RateLimitGatewayFilter implements GlobalFilter, Ordered {
    private final RateLimitConfig cfg;
    public RateLimitGatewayFilter(RateLimitConfig cfg) { this.cfg = cfg; }
    @Override public Mono<Void> filter(ServerWebExchange ex, GatewayFilterChain chain) {
        String ip = ex.getRequest().getRemoteAddress() != null
            ? ex.getRequest().getRemoteAddress().getAddress().getHostAddress() : "unknown";
        Bucket b = cfg.bucketFor(ip);
        if (b.tryConsume(1)) return chain.filter(ex);
        ex.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        return ex.getResponse().setComplete();
    }
    @Override public int getOrder() { return -15; }
}