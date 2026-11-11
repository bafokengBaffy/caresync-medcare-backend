package health.caresync.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReferralRequest(
        @NotBlank String patientId,
        @NotBlank String fromProviderId,
        @NotBlank String toProviderId,
        @NotBlank @Size(max=1000) String reason,
        @NotBlank String priority
) {}