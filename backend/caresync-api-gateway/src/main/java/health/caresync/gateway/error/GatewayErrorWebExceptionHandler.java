package health.caresync.gateway.error;

import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.boot.web.server.WebServerException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Order(-2)
public class GatewayErrorWebExceptionHandler implements ErrorWebExceptionHandler {
    private final RateLimitExceededHandler responseWriter;

    public GatewayErrorWebExceptionHandler(RateLimitExceededHandler responseWriter) {
        this.responseWriter = responseWriter;
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable error) {
        Throwable cause = NestedExceptionUtils.getMostSpecificCause(error);
        HttpStatus status = cause instanceof ResponseStatusException responseStatus
            ? HttpStatus.valueOf(responseStatus.getStatusCode().value())
            : cause instanceof WebServerException
                ? HttpStatus.BAD_GATEWAY
                : HttpStatus.INTERNAL_SERVER_ERROR;
        String message = status.is5xxServerError()
            ? "The gateway could not complete the request"
            : cause instanceof ResponseStatusException responseStatus
                ? responseStatus.getReason()
                : status.getReasonPhrase();
        return responseWriter.writeError(exchange, status, message);
    }
}