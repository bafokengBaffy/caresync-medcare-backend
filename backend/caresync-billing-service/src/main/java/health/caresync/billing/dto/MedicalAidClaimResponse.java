package health.caresync.billing.dto;

import health.caresync.billing.domain.enums.ClaimStatus;
import java.time.Instant;
import java.util.UUID;

public record MedicalAidClaimResponse(
    UUID id,
    UUID invoiceId,
    String providerName,
    String memberNumber,
    long claimAmountCents,
    String currency,
    ClaimStatus status,
    String decisionReason,
    Instant submittedAt,
    Instant decisionAt
) {
}