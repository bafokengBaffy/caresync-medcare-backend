package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import health.caresync.gateway.error.GatewayErrorWebExceptionHandler;
import health.caresync.gateway.error.RateLimitExceededHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ResponseStatusException;

class GatewayErrorResponseTest {
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final RateLimitExceededHandler responseWriter = new RateLimitExceededHandler(objectMapper);

    @Test
    void rateLimitResponseContainsRetryHintAndRequestId() throws Exception {
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/patients")
                .header("X-Request-Id", "request-123")
                .build()
        );

        responseWriter.handle(exchange).block();

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exchange.getResponse().getStatusCode());
        assertEquals("60", exchange.getResponse().getHeaders().getFirst("Retry-After"));
        JsonNode body = objectMapper.readTree(exchange.getResponse().getBodyAsString().block());
        assertEquals("request-123", body.get("requestId").asText());
        assertEquals("Too many requests", body.get("message").asText());
    }

    @Test
    void gatewayMapsClientStatusWithoutExposingInternalFailureDetails() throws Exception {
        GatewayErrorWebExceptionHandler errorHandler = new GatewayErrorWebExceptionHandler(responseWriter);
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/missing").build()
        );

        errorHandler.handle(exchange, new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found")).block();

        assertEquals(HttpStatus.NOT_FOUND, exchange.getResponse().getStatusCode());
        JsonNode body = objectMapper.readTree(exchange.getResponse().getBodyAsString().block());
        assertEquals("Not found", body.get("message").asText());
    }

    @Test
    void gatewayMasksUnexpectedServerErrors() throws Exception {
        GatewayErrorWebExceptionHandler errorHandler = new GatewayErrorWebExceptionHandler(responseWriter);
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest.get("/api/v1/private").build()
        );

        errorHandler.handle(exchange, new IllegalStateException("private details")).block();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exchange.getResponse().getStatusCode());
        JsonNode body = objectMapper.readTree(exchange.getResponse().getBodyAsString().block());
        assertEquals("The gateway could not complete the request", body.get("message").asText());
    }
}
