package health.caresync.billing.mapper;

import health.caresync.billing.domain.entity.PackageBilling;
import health.caresync.billing.dto.PackageBillingResponse;
import org.springframework.stereotype.Component;

@Component
public class PackageBillingMapper {

    public PackageBillingResponse toResponse(PackageBilling p) {
        if (p == null) return null;
        return new PackageBillingResponse(
                p.getId(),
                p.getTenantId(),
                p.getPatientId(),
                p.getPackageCode(),
                p.getGrossPrice(),
                p.getDiscountAmount(),
                p.getDiscountType(),
                p.getNetPrice(),
                p.getPaymentRoute(),
                p.getTotalSessions(),
                p.getUsedSessions(),
                p.getStatus(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}