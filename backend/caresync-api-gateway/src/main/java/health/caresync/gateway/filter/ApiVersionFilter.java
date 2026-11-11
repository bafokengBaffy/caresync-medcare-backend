package health.caresync.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Enforces API versioning.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A05 – Misconfiguration: rejects unsupported versions, no silent fallback.</li>
 *   <li>A03 – Injection: version validated against a strict allow-list.</li>
 *   <li>A09 – Logging: logs version rejections with correlation id (no PII).</li>
 * </ul>
 */
@Component
public class ApiVersionFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(ApiVersionFilter.class);

    /** Supported API versions – update this allow-list when adding new versions. */
    private static final Set<String> SUPPORTED_VERSIONS = Set.of("v1");

    /** Canonical header used for version negotiation. */
    private static final String VERSION_HEADER = "X-API-Version";

    /** Canonical request-id header (set by CorrelationIdFilter). */
    private static final String CORRELATION_HEADER = "X-Correlation-Id";

    /** Path prefix pattern, e.g. /api/v1/... */
    private static final Pattern PATH_VERSION_PATTERN = Pattern.compile("^/api/(v\\d{1,3})(/.*)?$");

    /** Only accept short, bounded version tokens. */
    private static final Pattern VALID_VERSION_TOKEN = Pattern.compile("^v\\d{1,3}$");

    private static final int VERSION_HEADER_MAX_LENGTH = 8;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getRawPath();
        String correlationId = request.getHeaders().getFirst(CORRELATION_HEADER);

        if (request.getMethod() == HttpMethod.OPTIONS
                || !path.equals("/api") && !path.startsWith("/api/")) {
            return chain.filter(exchange);
        }

        String version = null;

        // 1. Path-based versioning takes precedence (e.g. /api/v1/...)
        Matcher pathMatcher = PATH_VERSION_PATTERN.matcher(path);
        if (pathMatcher.matches()) {
            version = pathMatcher.group(1);
        }

        // 2. Header-based versioning fallback
        if (version == null) {
            String headerValue = request.getHeaders().getFirst(VERSION_HEADER);
            if (headerValue != null) {
                // Bound length before validation to avoid abuse (A03/A05).
                if (headerValue.length() > VERSION_HEADER_MAX_LENGTH) {
                    return reject(exchange, HttpStatus.BAD_REQUEST,
                            "Invalid API version header", correlationId, "version_too_long");
                }
                if (!VALID_VERSION_TOKEN.matcher(headerValue).matches()) {
                    return reject(exchange, HttpStatus.BAD_REQUEST,
                            "Invalid API version format", correlationId, "version_malformed");
                }
                version = headerValue.trim();
            }
        }

        // 3. No version supplied: default to v1 only if explicitly allowed; otherwise reject.
        //    We fail-closed (A05) – require clients to be explicit.
        if (version == null) {
            return reject(exchange, HttpStatus.BAD_REQUEST,
                    "API version required. Provide X-API-Version header or /api/vN/ path.",
                    correlationId, "version_missing");
        }

        // 4. Allow-list check (A01/A03).
        if (!SUPPORTED_VERSIONS.contains(version)) {
            return reject(exchange, HttpStatus.NOT_ACCEPTABLE,
                    "Unsupported API version", correlationId, "version_unsupported:" + version);
        }

        // 5. Normalize: forward the version downstream as a trusted header.
        String negotiatedVersion = version;
        ServerHttpRequest mutated = request.mutate()
                .headers(headers -> {
                    headers.set(VERSION_HEADER, negotiatedVersion);
                    // Ensure we do not forward unvalidated client-supplied duplicates.
                    headers.remove("X-Forwarded-API-Version");
                })
                .build();

        return chain.filter(exchange.mutate().request(mutated).build());
    }

    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status,
                              String message, String correlationId, String reason) {
        // Safe logging – no PII, no raw user input echoed beyond validated allow-list reason.
        log.warn("api_version_rejected status={} reason={} correlationId={}",
                status.value(), reason, sanitizeForLog(correlationId));

        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().setCacheControl("no-store");
        if (correlationId != null) {
            response.getHeaders().set(CORRELATION_HEADER, correlationId);
        }

        String body = String.format(
                "{\"error\":\"api_version_error\",\"message\":\"%s\",\"correlationId\":\"%s\"}",
                jsonEscape(message), jsonEscape(correlationId));

        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    /** Strip CR/LF to prevent log injection (A09). */
    private static String sanitizeForLog(String value) {
        if (value == null) {
            return "null";
        }
        return value.replaceAll("[\\r\\n\\t]", "_");
    }

    /** Minimal JSON escaping to prevent response injection (A03). */
    private static String jsonEscape(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length() + 8);
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    @Override
    public int getOrder() {
        // Run very early, before auth, so we can reject bad versions cheaply.
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }
}