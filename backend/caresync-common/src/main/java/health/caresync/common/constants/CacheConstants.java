package health.caresync.common.constants;

public final class CacheConstants {
    private CacheConstants() {}
    public static final String PATIENT_CACHE = "patient";
    public static final String PROVIDER_CACHE = "provider";
    public static final String INVOICE_CACHE = "invoice";
    public static final long DEFAULT_TTL_MINUTES = 15L;
}