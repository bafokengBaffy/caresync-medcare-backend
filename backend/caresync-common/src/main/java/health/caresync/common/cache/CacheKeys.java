package health.caresync.common.cache;

/** Central catalogue of cache keys (avoids typos, aids observability). */
public final class CacheKeys {
    private CacheKeys() {}
    public static final String TENANT = "tenant:";
    public static final String PATIENT = "patient:";
    public static final String PROVIDER = "provider:";
    public static final String INVOICE = "invoice:";
    public static final String IDEMPOTENCY = "idem:";
    public static final String RATE_LIMIT = "rl:";
    public static String scoped(String prefix, String tenantId, String id) {
        return prefix + tenantId + ":" + id;
    }
}