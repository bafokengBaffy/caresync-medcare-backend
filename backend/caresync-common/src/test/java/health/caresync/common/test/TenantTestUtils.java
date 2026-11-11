package health.caresync.common.test;

import health.caresync.common.security.TenantContext;

/** Helpers to run tests under a specific tenant context. */
public final class TenantTestUtils {
    private TenantTestUtils() {}
    public static void withTenant(String tenantId, Runnable r) {
        String prev = TenantContext.getTenantId();
        try {
            TenantContext.setTenantId(tenantId);
            r.run();
        } finally {
            if (prev == null) TenantContext.clear();
            else TenantContext.setTenantId(prev);
        }
    }
}