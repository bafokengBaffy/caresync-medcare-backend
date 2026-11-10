package health.caresync.common.tenant;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;

public class TenantAwareEntityListener {
    @PrePersist
    public void prePersist(Object entity) {
        if (entity instanceof TenantAware tenantAware) {
            TenantIsolationValidator.assignOrValidate(tenantAware);
        }
    }

    @PreUpdate
    @PreRemove
    public void validateTenant(Object entity) {
        if (entity instanceof TenantAware tenantAware) {
            TenantIsolationValidator.validate(tenantAware);
        }
    }
}
