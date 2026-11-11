package health.caresync.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProBonoRequest(
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9_\\-]{1,64}$") String patientId,
        @NotBlank @Pattern(regexp = "^[A-Z0-9_\\-]{1,64}$") String serviceCode,
        @NotBlank @Size(max = 500) String reason
) {}