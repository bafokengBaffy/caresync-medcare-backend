package health.caresync.common.test;

import health.caresync.common.security.TenantContext;

/** Sets and restores a tenant context for the duration of a test. */
public final class TestSecurityContext implements AutoCloseable {

    private final String previous;

    private TestSecurityContext(String tenantId) {
        this.previous = TenantContext.getTenantId();
        TenantContext.setTenantId(tenantId);
    }

    public static TestSecurityContext withTenant(String tenantId) {
        return new TestSecurityContext(tenantId);
    }

    @Override
    public void close() {
        if (previous == null) TenantContext.clear();
        else TenantContext.setTenantId(previous);
    }
}