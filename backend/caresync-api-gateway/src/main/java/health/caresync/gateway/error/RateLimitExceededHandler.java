package health.caresync.gateway.error;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import health.caresync.gateway.dto.ErrorResponse;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RateLimitExceededHandler {
    private final ObjectMapper objectMapper;

    public RateLimitExceededHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Mono<Void> handle(ServerWebExchange exchange) {
        exchange.getResponse().getHeaders().set("Retry-After", "60");
        return writeError(exchange, HttpStatus.TOO_MANY_REQUESTS, "Too many requests");
    }

    public Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String message) {
        if (exchange.getResponse().isCommitted()) {
            return Mono.error(new IllegalStateException("Cannot write an error after the response is committed"));
        }
        String requestId = exchange.getResponse().getHeaders().getFirst("X-Request-Id");
        if (requestId == null) {
            requestId = exchange.getRequest().getHeaders().getFirst("X-Request-Id");
        }
        ErrorResponse body = new ErrorResponse(
            Instant.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            exchange.getRequest().getURI().getPath(),
            requestId
        );
        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (JsonProcessingException exception) {
            return Mono.error(exception);
        }
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().setCacheControl("no-store");
        return exchange.getResponse().writeWith(
            Mono.just(exchange.getResponse().bufferFactory().wrap(bytes))
        );
    }
}