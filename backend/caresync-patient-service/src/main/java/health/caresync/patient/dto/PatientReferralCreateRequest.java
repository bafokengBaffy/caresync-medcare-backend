package health.caresync.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientReferralCreateRequest(
    @NotBlank
    @Pattern(regexp = "INTERNAL|EXTERNAL")
    String referralType,
    @NotBlank
    @Size(max = 200)
    String recipientName,
    @Size(max = 200)
    String recipientOrganization,
    @NotBlank
    @Size(max = 4000)
    String reason,
    @Size(max = 4000)
    String notes
) { }
