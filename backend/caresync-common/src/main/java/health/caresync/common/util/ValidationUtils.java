package health.caresync.common.util;

public final class ValidationUtils {
    private ValidationUtils() {}
    public static boolean isBlank(String s) { return s == null || s.isBlank(); }
    public static String requireNonBlank(String s, String field) {
        if (isBlank(s)) throw new IllegalArgumentException(field + " is required");
        return s;
    }
}