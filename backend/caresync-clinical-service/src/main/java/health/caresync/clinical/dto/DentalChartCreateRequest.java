package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record DentalChartCreateRequest(
    @NotNull UUID patientId,
    @NotNull UUID providerId,
    @NotNull LocalDate chartDate,
    @NotBlank @Size(max = 4000) String findings,
    @Size(max = 4000) String treatmentPlan,
    @Size(max = 2000) String notes
) { }
