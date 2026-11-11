package health.caresync.billing.mapper;

import health.caresync.billing.domain.entity.MedicalAidClaim;
import health.caresync.billing.dto.MedicalAidClaimResponse;
import org.springframework.stereotype.Component;

@Component
public class MedicalAidClaimMapper {

    public MedicalAidClaimResponse toResponse(MedicalAidClaim c) {
        if (c == null) return null;
        return new MedicalAidClaimResponse(
                c.getId(),
                c.getInvoiceId(),
                c.getProviderName(),
                c.getMemberNumber(),
                c.getClaimAmountCents(),
                c.getCurrency(),
                c.getStatus(),
                c.getDecisionReason(),
                c.getSubmittedAt(),
                c.getDecisionAt()
        );
    }
}