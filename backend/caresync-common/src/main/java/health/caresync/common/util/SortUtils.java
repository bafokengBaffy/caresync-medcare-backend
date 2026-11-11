package health.caresync.common.util;

import java.util.Set;

/** Whitelist-based sort field validation (OWASP A03: no injection via sort). */
public final class SortUtils {
    private SortUtils() {}
    public static String safeSortField(String requested, Set<String> allowed, String fallback) {
        if (requested == null) return fallback;
        return allowed.contains(requested) ? requested : fallback;
    }
}