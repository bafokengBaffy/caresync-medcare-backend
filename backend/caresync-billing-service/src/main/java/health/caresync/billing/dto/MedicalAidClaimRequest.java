package health.caresync.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record MedicalAidClaimRequest(
    @NotNull UUID invoiceId,
    @NotBlank @Size(max = 120) String providerName,
    @NotBlank @Size(max = 120) String memberNumber,
    @Positive long claimAmountCents
) {
}