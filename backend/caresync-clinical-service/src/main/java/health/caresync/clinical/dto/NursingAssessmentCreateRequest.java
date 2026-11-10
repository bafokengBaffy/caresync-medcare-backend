package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record NursingAssessmentCreateRequest(
    @NotNull UUID patientId,
    @NotNull UUID providerId,
    @NotNull LocalDate assessmentDate,
    @Size(max = 2000) String chiefComplaint,
    @NotBlank @Size(max = 4000) String findings,
    @Size(max = 4000) String carePlan,
    @Size(max = 2000) String notes
) { }