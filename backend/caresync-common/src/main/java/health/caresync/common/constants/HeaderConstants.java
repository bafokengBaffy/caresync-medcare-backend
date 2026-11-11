package health.caresync.common.constants;

public final class HeaderConstants {
    private HeaderConstants() {}
    public static final String CORRELATION_ID = "X-Correlation-Id";
    public static final String REQUEST_ID = "X-Request-Id";
    public static final String TENANT_ID = "X-Tenant-Id";
    public static final String IDEMPOTENCY_KEY = "Idempotency-Key";
    public static final String API_VERSION = "X-Api-Version";
}