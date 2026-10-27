package health.caresync.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConsentRevokeRequest(
    @NotBlank @Size(max = 1000) String reason
) {
}
