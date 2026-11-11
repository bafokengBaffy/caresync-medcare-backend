package health.caresync.common.constants;

public final class ErrorConstants {
    private ErrorConstants() {}
    public static final String VALIDATION_FAILED = "validation_failed";
    public static final String NOT_FOUND = "not_found";
    public static final String FORBIDDEN = "forbidden";
    public static final String UNAUTHORIZED = "unauthorized";
    public static final String CONFLICT = "conflict";
    public static final String INTERNAL = "internal_error";
    public static final String TENANT_MISMATCH = "tenant_mismatch";
    public static final String RATE_LIMIT = "rate_limit_exceeded";
}