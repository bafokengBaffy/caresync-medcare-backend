package health.caresync.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record ConsentCreateRequest(
    @NotBlank
    @Pattern(regexp = "[A-Z][A-Z0-9_]{1,63}")
    String consentType,
    @NotBlank
    @Size(max = 2000)
    String purpose,
    Instant expiresAt
) {
}