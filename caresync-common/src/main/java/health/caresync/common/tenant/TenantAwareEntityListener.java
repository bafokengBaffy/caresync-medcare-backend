package health.caresync.common.tenant;
import jakarta.persistence.PrePersist;
import health.caresync.common.security.TenantContext;

public class TenantAwareEntityListener {
    @PrePersist
    public void prePersist(Object entity) {
        if (entity instanceof TenantAware t && t.getTenantId() == null) {
            t.setTenantId(TenantContext.require());
        }
    }
}