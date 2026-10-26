package health.caresync.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import health.caresync.common.security.TenantContext;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class BolaDefenseFilterTest {
    @Test
    void tenantContextIsRequiredBeforeTenantScopedDatabaseOperations() {
        TenantContext.clear();
        try {
            org.junit.jupiter.api.Assertions.assertThrows(
                IllegalStateException.class, TenantContext::require
            );
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void tenantContextUsesUuidIdentity() {
        UUID tenantId = UUID.randomUUID();
        try {
            TenantContext.set(tenantId);
            assertEquals(tenantId, TenantContext.require());
        } finally {
            TenantContext.clear();
        }
    }
}