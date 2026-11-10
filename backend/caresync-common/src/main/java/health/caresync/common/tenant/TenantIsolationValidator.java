package health.caresync.common.tenant;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.TenantMismatchException;
import health.caresync.common.security.TenantContext;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class TenantIsolationValidator {
    public void validate(Object entity) {
        if (!(entity instanceof TenantAware tenantAware)) {
            return;
        }

        validate(tenantAware);
    }

    public static UUID assignOrValidate(TenantAware entity) {
        Objects.requireNonNull(entity, "Tenant-aware entity is required");
        UUID currentTenant = TenantContext.get();
        UUID entityTenant = entity.getTenantId();
        if (entityTenant == null) {
            if (currentTenant == null) {
                throw new TenantMismatchException("Tenant context is required for tenant data");
            }
            entity.setTenantId(currentTenant);
            return currentTenant;
        }
        if (currentTenant == null || !currentTenant.equals(entityTenant)) {
            throw new TenantMismatchException("Tenant data does not match the current tenant");
        }
        return entityTenant;
    }

    public static void validate(TenantAware entity) {
        Objects.requireNonNull(entity, "Tenant-aware entity is required");
        UUID currentTenant = TenantContext.get();
        UUID entityTenant = entity.getTenantId();
        if (currentTenant == null || entityTenant == null || !currentTenant.equals(entityTenant)) {
            throw new ForbiddenException("Access denied for tenant-scoped data");
        }
    }
}
