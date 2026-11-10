package health.caresync.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientReferralStatusRequest(
    @NotBlank
    @Pattern(regexp = "SENT|ACCEPTED|DECLINED|COMPLETED|CANCELLED")
    String status,
    @Size(max = 4000)
    String notes
) { }
