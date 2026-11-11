package health.caresync.gateway.filter;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.reactivestreams.Publisher;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Safe HTTP cache policy.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A01 – Broken access control: never cache authenticated/PHI responses.</li>
 *   <li>A05 – Misconfiguration: strict allow-list of cacheable endpoints.</li>
 *   <li>A03 – Injection: cache keys use only allow-listed paths and headers.</li>
 *   <li>A04 – Insecure design: bounded TTL, no unbounded cache.</li>
 * </ul>
 *
 * <p>Only bounded, explicitly public GET responses are retained in a bounded
 * in-memory cache. Sensitive, personalized, queried, and oversized responses
 * are never cached.
 */
@Component
public class ResponseCachingFilter implements GlobalFilter, Ordered {

    /** Only these public, non-PHI GET endpoints may be cached. */
    private static final Set<String> CACHEABLE_PREFIXES = Set.of(
            "/api/v1/public/",
            "/api/v1/reference/"
    );

    /** Endpoints that must ALWAYS be no-store (PHI/PII/auth). */
    private static final Set<String> NEVER_CACHE_PREFIXES = Set.of(
            "/api/v1/patients",
            "/api/v1/clinical",
            "/api/v1/billing",
            "/api/v1/laboratory",
            "/api/v1/auth",
            "/api/v1/notes",
            "/api/v1/admin",
            "/actuator"
    );

    private static final Set<String> SENSITIVE_CONTEXT_HEADERS = Set.of(
            HttpHeaders.AUTHORIZATION,
            HttpHeaders.COOKIE,
            "X-API-Key",
            "X-User-Id",
            "X-Tenant-Id",
            "X-Role",
            "X-Consent-Verified",
            "X-Consent-Version"
    );

    private static final Set<String> CACHEABLE_VARY_HEADERS = Set.of(
            "accept-encoding",
            "x-api-version"
    );

    private static final Set<String> CACHED_RESPONSE_HEADERS = Set.of(
            HttpHeaders.CONTENT_TYPE.toLowerCase(Locale.ROOT),
            HttpHeaders.CONTENT_ENCODING.toLowerCase(Locale.ROOT),
            HttpHeaders.CACHE_CONTROL.toLowerCase(Locale.ROOT),
            HttpHeaders.ETAG.toLowerCase(Locale.ROOT),
            HttpHeaders.LAST_MODIFIED.toLowerCase(Locale.ROOT),
            HttpHeaders.VARY.toLowerCase(Locale.ROOT),
            HttpHeaders.EXPIRES.toLowerCase(Locale.ROOT),
            "x-content-type-options"
    );

    /** Bounded TTL for cacheable public content. */
    private static final Duration CACHE_TTL = Duration.ofSeconds(60);
    private static final int MAX_CACHEABLE_BODY_BYTES = 256 * 1024;
    private static final Cache<CacheKey, CachedResponse> CACHE = Caffeine.newBuilder()
            .maximumSize(500)
            .expireAfterWrite(CACHE_TTL)
            .build();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Never cache non-GET (A01/A05).
        if (method != HttpMethod.GET) {
            return setNoStoreAndContinue(exchange, chain);
        }

        // 2. Never cache anything under protected prefixes (A01).
        if (NEVER_CACHE_PREFIXES.stream().anyMatch(path::startsWith)) {
            return setNoStoreAndContinue(exchange, chain);
        }

        // 3. Cacheable only if explicitly allow-listed and independent of request context.
        boolean allowListed = CACHEABLE_PREFIXES.stream().anyMatch(path::startsWith);
        boolean hasSensitiveContext = SENSITIVE_CONTEXT_HEADERS.stream()
                .anyMatch(request.getHeaders()::containsKey);
        boolean hasQuery = request.getURI().getQuery() != null;

        if (!allowListed || hasSensitiveContext || hasQuery) {
            return setNoStoreAndContinue(exchange, chain);
        }

        CacheKey cacheKey = cacheKey(request);
        CachedResponse cached = CACHE.getIfPresent(cacheKey);
        if (cached != null) {
            return writeCachedResponse(exchange.getResponse(), cached);
        }

        // 4. Set conservative cache headers; downstream may override with stricter.
        exchange.getResponse().getHeaders().setCacheControl(
                "public, max-age=" + CACHE_TTL.toSeconds() + ", must-revalidate");
        exchange.getResponse().getHeaders().set("Vary", "Accept-Encoding, X-API-Version");

        ServerHttpResponse response = exchange.getResponse();
        return chain.filter(exchange.mutate().response(decorate(response, cacheKey)).build());
    }

    private ServerHttpResponseDecorator decorate(ServerHttpResponse response, CacheKey key) {
        return new ServerHttpResponseDecorator(response) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                long contentLength = getHeaders().getContentLength();
                if (getStatusCode() == null
                        || getStatusCode().value() != HttpStatus.OK.value()
                        || contentLength < 0
                        || contentLength > MAX_CACHEABLE_BODY_BYTES
                        || !isCacheSafe(getHeaders())) {
                    getHeaders().setCacheControl("no-store, no-cache, must-revalidate, private");
                    return super.writeWith(body);
                }

                if (contentLength == 0) {
                    CACHE.put(key, new CachedResponse(
                            getStatusCode(),
                            cacheSafeHeaders(getHeaders()),
                            new byte[0]
                    ));
                    return super.setComplete();
                }

                return DataBufferUtils.join(body, MAX_CACHEABLE_BODY_BYTES)
                        .flatMap(joined -> {
                            byte[] bytes = new byte[joined.readableByteCount()];
                            joined.read(bytes);
                            DataBufferUtils.release(joined);
                            if (bytes.length == contentLength && isCacheSafe(getHeaders())) {
                                CACHE.put(key, new CachedResponse(
                                        getStatusCode(),
                                        cacheSafeHeaders(getHeaders()),
                                        bytes
                                ));
                            } else {
                                getHeaders().setCacheControl(
                                        "no-store, no-cache, must-revalidate, private");
                            }
                            return super.writeWith(Mono.just(bufferFactory().wrap(bytes)));
                        });
            }

            @Override
            public Mono<Void> writeAndFlushWith(
                    Publisher<? extends Publisher<? extends DataBuffer>> body
            ) {
                return writeWith(Flux.from(body).concatMap(Flux::from));
            }
        };
    }

    private boolean isCacheSafe(HttpHeaders headers) {
        if (headers.containsKey(HttpHeaders.SET_COOKIE)) {
            return false;
        }
        String cacheControl = headers.getCacheControl();
        if (cacheControl != null) {
            String normalized = cacheControl.toLowerCase(Locale.ROOT);
            if (normalized.contains("no-store")
                    || normalized.contains("no-cache")
                    || normalized.contains("private")) {
                return false;
            }
        }
        List<String> varyValues = headers.getVary();
        return varyValues.stream()
                .flatMap(value -> java.util.Arrays.stream(value.split(",")))
                .map(String::trim)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .allMatch(value -> CACHEABLE_VARY_HEADERS.contains(value));
    }

    private HttpHeaders cacheSafeHeaders(HttpHeaders source) {
        HttpHeaders headers = new HttpHeaders();
        source.forEach((name, values) -> {
            if (CACHED_RESPONSE_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
                headers.put(name, List.copyOf(values));
            }
        });
        return HttpHeaders.readOnlyHttpHeaders(headers);
    }

    private CacheKey cacheKey(ServerHttpRequest request) {
        return new CacheKey(
                request.getURI().getRawPath(),
                valueOrEmpty(request.getHeaders().getFirst("X-API-Version")),
                valueOrEmpty(request.getHeaders().getFirst(HttpHeaders.ACCEPT)),
                valueOrEmpty(request.getHeaders().getFirst(HttpHeaders.ACCEPT_ENCODING))
        );
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private Mono<Void> writeCachedResponse(ServerHttpResponse response, CachedResponse cached) {
        response.setStatusCode(cached.status());
        response.getHeaders().putAll(cached.headers());
        response.getHeaders().setContentLength(cached.body().length);
        DataBuffer buffer = response.bufferFactory().wrap(cached.body().clone());
        return response.writeWith(Mono.just(buffer));
    }

    private Mono<Void> setNoStoreAndContinue(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Explicitly forbid caching of sensitive responses (A01/A05).
        exchange.getResponse().getHeaders().setCacheControl("no-store, no-cache, must-revalidate, private");
        exchange.getResponse().getHeaders().setPragma("no-cache");
        exchange.getResponse().getHeaders().setExpires(0L);
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        // After auth/consent so we know whether response is sensitive; before routing.
        return Ordered.LOWEST_PRECEDENCE - 30;
    }

    private record CacheKey(String path, String version, String accept, String acceptEncoding) {}

    private record CachedResponse(HttpStatusCode status, HttpHeaders headers, byte[] body) {
        private CachedResponse {
            body = body.clone();
        }
    }
}