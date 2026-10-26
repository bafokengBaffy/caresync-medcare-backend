package health.caresync.gateway.error;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
@Component @Order(-2)
public class GatewayErrorWebExceptionHandler implements ErrorWebExceptionHandler {
    @Override public Mono<Void> handle(ServerWebExchange ex, Throwable t) { return Mono.error(t); }
}