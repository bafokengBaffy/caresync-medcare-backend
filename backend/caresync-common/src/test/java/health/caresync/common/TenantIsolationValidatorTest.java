package health.caresync.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.TenantMismatchException;
import health.caresync.common.security.TenantContext;
import health.caresync.common.tenant.TenantAwareEntityListener;
import health.caresync.common.tenant.TenantAware;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class TenantIsolationValidatorTest {
    private final TenantAwareEntityListener listener = new TenantAwareEntityListener();

    @AfterEach
    void clearTenantContext() {
        TenantContext.clear();
    }

    @Test
    void assignsCurrentTenantToNewEntity() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.set(tenantId);
        TestTenantEntity entity = new TestTenantEntity();

        listener.prePersist(entity);

        assertEquals(tenantId, entity.getTenantId());
    }

    @Test
    void rejectsNewEntityWithAnotherTenantId() {
        TenantContext.set(UUID.randomUUID());
        TestTenantEntity entity = new TestTenantEntity();
        entity.setTenantId(UUID.randomUUID());

        assertThrows(TenantMismatchException.class, () -> listener.prePersist(entity));
    }

    @Test
    void rejectsTenantMismatchOnUpdateAndDelete() {
        TenantContext.set(UUID.randomUUID());
        TestTenantEntity entity = new TestTenantEntity();
        entity.setTenantId(UUID.randomUUID());

        assertThrows(ForbiddenException.class, () -> listener.validateTenant(entity));
    }

    private static final class TestTenantEntity implements TenantAware {
        private UUID tenantId;

        @Override
        public UUID getTenantId() {
            return tenantId;
        }

        @Override
        public void setTenantId(UUID tenantId) {
            this.tenantId = tenantId;
        }
    }
}