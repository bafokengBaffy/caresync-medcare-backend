package health.caresync.common.test;

import java.util.Map;

/** Builds deterministic JWT-like claim maps for tests (never used in prod). */
public final class MockJwtFactory {
    private MockJwtFactory() {}
    public static Map<String, Object> claims(String tenantId, String subject, String... roles) {
        return Map.of(
                "tenant_id", tenantId,
                "sub", subject,
                "roles", roles,
                "mfa_verified", true
        );
    }
}