package health.caresync.common.test;

import java.util.UUID;

/** Deterministic IDs for test fixtures (not for production). */
public final class TestDataFactory {
    private TestDataFactory() {}
    public static String patientId() { return "pat-" + UUID.randomUUID(); }
    public static String providerId() { return "prov-" + UUID.randomUUID(); }
    public static String tenantId()   { return "ten-" + UUID.randomUUID(); }
}