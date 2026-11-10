package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record PatientDiagnosisCodeRequest(
    @NotNull UUID patientId,
    @NotBlank @Size(max = 40) @Pattern(regexp = "[A-Za-z0-9._-]+") String codingSystem,
    @NotBlank @Size(max = 40) @Pattern(regexp = "[A-Za-z0-9._-]+") String diagnosisCode,
    @NotNull LocalDate codedOn
) {
}
