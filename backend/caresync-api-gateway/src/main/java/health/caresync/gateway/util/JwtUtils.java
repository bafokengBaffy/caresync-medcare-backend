package health.caresync.gateway.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Safe JWT utility helpers.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A02 – Cryptographic failures: no signature verification here; callers must use GatewayTokenVerifier.</li>
 *   <li>A03 – Injection: strict base64url / JSON handling; bounded sizes.</li>
 *   <li>A08 – Data integrity: constant-time claim comparisons.</li>
 * </ul>
 *
 * <p><b>Security note:</b> This class NEVER trusts claim values for authorization decisions
 * without a prior signature verification.
 */
public final class JwtUtils {

    /** Max encoded token size we are willing to parse (A04). */
    private static final int MAX_TOKEN_LENGTH = 8192;

    /** Max decoded header/payload size we are willing to deserialize. */
    private static final int MAX_SEGMENT_BYTES = 4096;

    private JwtUtils() {
    }

    /**
     * Split a JWT into its 3 segments. Returns null if malformed or oversized.
     */
    public static String[] splitToken(String token) {
        if (token == null || token.length() > MAX_TOKEN_LENGTH) {
            return null;
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) {
            return null;
        }
        for (String p : parts) {
            if (p.isEmpty() || p.length() > MAX_SEGMENT_BYTES * 2) {
                return null;
            }
        }
        return parts;
    }

    /**
     * Decode a base64url segment. Bounded, no exceptions on malformed input.
     */
    public static byte[] decodeSegment(String segment) {
        if (segment == null || segment.length() > MAX_SEGMENT_BYTES * 2) {
            return null;
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(segment);
            if (decoded.length > MAX_SEGMENT_BYTES) {
                return null;
            }
            return decoded;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Return the raw payload segment as UTF-8 string. Does NOT parse JSON.
     * Callers must use a hardened JSON parser (Jackson with limits) if needed.
     */
    public static String payloadSegment(String token) {
        String[] parts = splitToken(token);
        return parts == null ? null : parts[1];
    }

    /** Header segment (e.g. to read "alg"). */
    public static String headerSegment(String token) {
        String[] parts = splitToken(token);
        return parts == null ? null : parts[0];
    }

    /** Signature segment. */
    public static String signatureSegment(String token) {
        String[] parts = splitToken(token);
        return parts == null ? null : parts[2];
    }

    /**
     * Constant-time string equality for security-sensitive claim comparisons.
     */
    public static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Extract a scalar string claim from a pre-parsed claims map.
     * Returns null if absent or of unexpected type.
     */
    public static String getStringClaim(Map<String, Object> claims, String key) {
        if (claims == null || key == null) return null;
        Object v = claims.get(key);
        return (v instanceof String s) ? s : null;
    }

    /**
     * Extract a claim that may be a single string or list of strings as a bounded set.
     * Anything else is ignored.
     */
    public static Set<String> getStringSetClaim(Map<String, Object> claims, String key) {
        if (claims == null || key == null) return Collections.emptySet();
        Object v = claims.get(key);
        if (v instanceof String s) {
            return Set.of(s);
        }
        if (v instanceof java.util.Collection<?> c) {
            HashSet<String> out = new HashSet<>();
            for (Object o : c) {
                if (o instanceof String s && s.length() <= 128 && out.size() < 64) {
                    out.add(s);
                }
            }
            return Collections.unmodifiableSet(out);
        }
        return Collections.emptySet();
    }

    /**
     * Return true if the token header advertises "none" or a weak/unknown alg.
     * Callers should reject these outright (algorithm confusion defense, A02).
     */
    public static boolean hasUnsafeAlgorithm(String headerSegment) {
        byte[] decoded = decodeSegment(headerSegment);
        if (decoded == null) {
            return true; // Treat undecodable as unsafe.
        }
        String header = new String(decoded, StandardCharsets.UTF_8);
        // Cheap, defensive check: reject "none" and known weak algs.
        String lower = header.toLowerCase();
        return lower.contains("\"alg\":\"none\"")
                || lower.contains("\"alg\": \"none\"")
                || lower.contains("\"alg\":\"hs256\"")
                || lower.contains("\"alg\": \"hs256\"");
    }
}