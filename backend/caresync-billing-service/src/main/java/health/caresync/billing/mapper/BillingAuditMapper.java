package health.caresync.billing.mapper;

import health.caresync.billing.domain.entity.BillingAuditLog;
import health.caresync.billing.domain.enums.BillingAuditResponse;
import org.springframework.stereotype.Component;

/**
 * Deterministic, side-effect-free mapper.
 */
@Component
public class BillingAuditMapper {

    public BillingAuditResponse toResponse(BillingAuditLog e) {
        if (e == null) return null;
        return new BillingAuditResponse(
                e.getId() == null ? null : e.getId().toString(),
                e.getTenantId() == null ? null : e.getTenantId().toString(),
                e.getResourceType(),
                e.getResourceId() == null ? null : e.getResourceId().toString(),
                e.getAction() != null ? e.getAction().name() : null,
                e.getActorName(),
                e.getCreatedAt(),
                null,
                e.getDetails()
        );
    }
}