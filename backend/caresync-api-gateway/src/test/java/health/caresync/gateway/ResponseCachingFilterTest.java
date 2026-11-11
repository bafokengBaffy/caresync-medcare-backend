package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;

import health.caresync.gateway.filter.ResponseCachingFilter;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

class ResponseCachingFilterTest {
    private final ResponseCachingFilter filter = new ResponseCachingFilter();

    @Test
    void enablesPublicCachingOnlyForAllowListedContextFreeGets() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/public/reference/countries").build()
        );

        filter.filter(exchange, ignored -> Mono.empty()).block();

        assertEquals(
            "public, max-age=60, must-revalidate",
            exchange.getResponse().getHeaders().getCacheControl()
        );
    }

    @Test
    void neverEnablesSharedCachingForTenantScopedOrQueryRequests() {
        MockServerWebExchange tenantRequest = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/public/reference/countries")
                .header("X-Tenant-Id", "tenant-1")
                .build()
        );
        MockServerWebExchange queryRequest = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/public/reference/countries?region=private")
                .build()
        );

        filter.filter(tenantRequest, ignored -> Mono.empty()).block();
        filter.filter(queryRequest, ignored -> Mono.empty()).block();

        assertEquals("no-store, no-cache, must-revalidate, private",
            tenantRequest.getResponse().getHeaders().getCacheControl());
        assertEquals("no-store, no-cache, must-revalidate, private",
            queryRequest.getResponse().getHeaders().getCacheControl());
    }

    @Test
    void reusesBoundedPublicResponseBodiesWithoutCallingDownstreamAgain() {
        byte[] body = "{\"reference\":\"public\"}".getBytes(StandardCharsets.UTF_8);
        AtomicInteger downstreamCalls = new AtomicInteger();
        GatewayFilterChain downstream = exchange -> {
            downstreamCalls.incrementAndGet();
            exchange.getResponse().setStatusCode(HttpStatus.OK);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            exchange.getResponse().getHeaders().setContentLength(body.length);
            return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(body.clone()))
            );
        };
        MockServerWebExchange first = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/public/reference/cache-test")
                .header("X-API-Version", "v1")
                .build()
        );
        MockServerWebExchange second = MockServerWebExchange.from(
            org.springframework.mock.http.server.reactive.MockServerHttpRequest
                .get("/api/v1/public/reference/cache-test")
                .header("X-API-Version", "v1")
                .build()
        );

        filter.filter(first, downstream).block();
        filter.filter(second, downstream).block();

        assertEquals(1, downstreamCalls.get());
        assertEquals("{\"reference\":\"public\"}", first.getResponse().getBodyAsString().block());
        assertEquals("{\"reference\":\"public\"}", second.getResponse().getBodyAsString().block());
    }
}
