package health.caresync.gateway.filter;
import io.github.bucket4j.Bucket;
import health.caresync.gateway.config.RateLimitConfig;
import health.caresync.gateway.error.RateLimitExceededHandler;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RateLimitGatewayFilter implements GlobalFilter, Ordered {
    private final RateLimitConfig cfg;
    private final RateLimitExceededHandler rateLimitExceededHandler;

    public RateLimitGatewayFilter(
        RateLimitConfig cfg,
        RateLimitExceededHandler rateLimitExceededHandler
    ) {
        this.cfg = cfg;
        this.rateLimitExceededHandler = rateLimitExceededHandler;
    }

    @Override public Mono<Void> filter(ServerWebExchange ex, GatewayFilterChain chain) {
        var remoteAddress = ex.getRequest().getRemoteAddress();
        String ip = remoteAddress == null || remoteAddress.getAddress() == null
            ? "unknown"
            : remoteAddress.getAddress().getHostAddress();
        Bucket b = cfg.bucketFor(ip);
        if (b.tryConsume(1)) return chain.filter(ex);
        return rateLimitExceededHandler.handle(ex);
    }
    @Override public int getOrder() { return -15; }
}