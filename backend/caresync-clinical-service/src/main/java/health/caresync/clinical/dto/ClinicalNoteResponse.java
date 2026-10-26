package health.caresync.clinical.dto;

import health.caresync.common.dto.Specialty;
import java.time.Instant;
import java.util.UUID;

public record ClinicalNoteResponse(
    String id,
    UUID patientId,
    UUID providerId,
    UUID appointmentId,
    Specialty specialty,
    String noteType,
    String status,
    Instant createdAt,
    SoapDataResponse soapData
) {
}
