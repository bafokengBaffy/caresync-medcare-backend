package health.caresync.clinical.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PatientDiagnosisCodeResponse(
    UUID id,
    UUID patientId,
    String codingSystem,
    String diagnosisCode,
    LocalDate codedOn,
    Instant createdAt
) {
}
