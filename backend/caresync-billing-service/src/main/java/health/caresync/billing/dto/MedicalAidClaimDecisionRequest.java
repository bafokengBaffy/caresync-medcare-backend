package health.caresync.billing.dto;

import health.caresync.billing.domain.enums.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MedicalAidClaimDecisionRequest(
    @NotNull ClaimStatus status,
    @Size(max = 500) String decisionReason
) {
}
