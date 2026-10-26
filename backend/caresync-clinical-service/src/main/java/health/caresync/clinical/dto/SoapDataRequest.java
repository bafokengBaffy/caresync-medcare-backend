package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotBlank;

public record SoapDataRequest(
    @NotBlank String subjective,
    @NotBlank String objective,
    @NotBlank String assessment,
    @NotBlank String plan
) {
}
