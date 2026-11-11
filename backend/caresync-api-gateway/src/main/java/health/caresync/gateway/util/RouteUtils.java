package health.caresync.gateway.util;

import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Route utility helpers.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A03 – Injection: strict allow-lists for headers/paths; rejects control chars.</li>
 *   <li>A10 – SSRF: never derive downstream URIs from client input.</li>
 *   <li>A01 – Broken access control: explicit allowed prefixes; deny-by-default.</li>
 * </ul>
 */
public final class RouteUtils {

    /** Max path length we accept (A04). */
    private static final int MAX_PATH_LENGTH = 2048;

    /** Allowed characters in a normalized path (A03). */
    private static final Pattern SAFE_PATH_PATTERN =
            Pattern.compile("^/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$");

    /** Forbidden traversal sequences (normalized before check). */
    private static final Pattern TRAVERSAL_PATTERN =
            Pattern.compile("(^|/)\\.\\.(/|$)|\\.\\.");

    /** Endpoints that must never be reachable through the gateway (A01/A10). */
    private static final Set<String> BLOCKED_PREFIXES = Set.of(
            "/actuator/env",
            "/actuator/configprops",
            "/actuator/beans",
            "/actuator/threaddump",
            "/actuator/heapdump",
            "/actuator/mappings",
            "/actuator/loggers",
            "/internal/",
            "/metadata/",
            "/admin/internal/"
    );

    /** Headers that must be stripped from client requests before routing downstream. */
    private static final Set<String> STRIPPED_REQUEST_HEADERS = Set.of(
            "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port",
            "x-original-url", "x-rewrite-url", "x-internal-service",
            "x-gateway-route", "forwarded"
    );

    private RouteUtils() {
    }

    /**
     * Normalize a raw request path. Returns null if the path is unsafe.
     */
    public static String normalizePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank() || rawPath.length() > MAX_PATH_LENGTH) {
            return null;
        }
        // Reject control chars / CRLF injection (A03).
        if (rawPath.chars().anyMatch(c -> c < 0x20 || c == 0x7F)) {
            return null;
        }
        // Strip query string if present.
        int q = rawPath.indexOf('?');
        String path = q >= 0 ? rawPath.substring(0, q) : rawPath;

        // Collapse consecutive slashes.
        path = path.replaceAll("/{2,}", "/");

        // Reject traversal before decoding.
        if (TRAVERSAL_PATTERN.matcher(path).find()) {
            return null;
        }

        // Reject percent-encoded traversal (e.g. %2e%2e).
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.contains("%2e%2e") || lower.contains("%252e") || lower.contains("%5c")) {
            return null;
        }

        if (!SAFE_PATH_PATTERN.matcher(path).matches()) {
            return null;
        }

        // Ensure leading slash, single trailing slash removal.
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        if (path.length() > 1 && path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        return path;
    }

    /**
     * Returns true if the path targets a blocked internal endpoint.
     */
    public static boolean isBlockedPath(String normalizedPath) {
        if (normalizedPath == null) return true;
        String lower = normalizedPath.toLowerCase(Locale.ROOT);
        for (String prefix : BLOCKED_PREFIXES) {
            if (lower.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * True if request should have its X-Internal-Service or similar stripped.
     */
    public static boolean isStrippedRequestHeader(String headerName) {
        if (headerName == null) return false;
        return STRIPPED_REQUEST_HEADERS.contains(headerName.toLowerCase(Locale.ROOT));
    }

    /**
     * Validate that a route's target URI uses http/https only (A10).
     * Rejects file:, ftp:, ldap:, jar:, classpath:, etc.
     */
    public static boolean isSafeDownstreamUri(URI uri) {
        if (uri == null || uri.getScheme() == null) return false;
        String scheme = uri.getScheme().toLowerCase(Locale.ROOT);
        return scheme.equals("http") || scheme.equals("https");
    }

    /**
     * Safe truncation for logging a path (A09).
     */
    public static String logSafePath(String path) {
        if (path == null) return "null";
        String p = path.replaceAll("[\\r\\n\\t\\x00-\\x1F\\x7F]", "_");
        return p.length() > 256 ? p.substring(0, 256) + "...[truncated]" : p;
    }

    /**
     * Sanitize an arbitrary string for logging (A09).
     */
    public static String sanitizeForLog(String value) {
        if (value == null) return "null";
        String s = value.replaceAll("[\\r\\n\\t]", "_");
        return s.length() > 128 ? s.substring(0, 128) + "..." : s;
    }
}