package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientDocumentVersionResponse(
    UUID id,
    UUID documentId,
    int versionNumber,
    String fileName,
    String contentType,
    long sizeBytes,
    String createdBy,
    Instant createdAt
) { }