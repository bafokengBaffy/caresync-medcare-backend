package health.caresync.patient.dto.portal;

import java.time.Instant;
import java.util.UUID;

public record PatientRecordItem(
    UUID id,
    String fileName,
    String contentType,
    long sizeBytes,
    String contentPath,
    Instant uploadedAt
) { }
