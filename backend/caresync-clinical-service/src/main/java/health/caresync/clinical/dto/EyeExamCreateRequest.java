package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record EyeExamCreateRequest(
    @NotNull UUID patientId,
    @NotNull UUID providerId,
    @NotNull LocalDate examDate,
    @Size(max = 64) String rightEyeAcuity,
    @Size(max = 64) String leftEyeAcuity,
    @Size(max = 1000) String diagnosis,
    @Size(max = 2000) String prescription,
    @Size(max = 2000) String notes
) { }