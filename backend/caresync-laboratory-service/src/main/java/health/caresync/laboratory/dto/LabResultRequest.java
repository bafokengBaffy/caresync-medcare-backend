package health.caresync.laboratory.dto;

import health.caresync.laboratory.domain.LabResultStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record LabResultRequest(
    @NotNull UUID patientId,
    @NotNull UUID providerId,
    @NotBlank @Size(max = 200) String testName,
    @Size(max = 64) String testCode,
    @NotNull LabResultStatus status,
    @Size(max = 1000) String resultValue,
    @Size(max = 64) String unit,
    @Size(max = 200) String referenceRange,
    @Size(max = 2000) String notes,
    @NotNull Instant orderedAt,
    Instant resultedAt
) { }
