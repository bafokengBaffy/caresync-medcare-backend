package health.caresync.billing.mapper;

import health.caresync.billing.domain.entity.Refund;
import health.caresync.billing.dto.RefundResponse;
import org.springframework.stereotype.Component;

@Component
public class RefundMapper {

    public RefundResponse toResponse(Refund r) {
        if (r == null) return null;
        return new RefundResponse(
                r.getId(),
                r.getPaymentId(),
                r.getInvoiceId(),
                r.getAmountCents(),
                r.getReason(),
                r.getStatus(),
                r.getProcessedAt()
        );
    }
}