package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientDocumentResponse(
    UUID id,
    String fileName,
    String contentType,
    long sizeBytes,
    Instant uploadedAt,
    String mediaUrl
) { }
