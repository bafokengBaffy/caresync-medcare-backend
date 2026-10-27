package health.caresync.patient.dto;

import health.caresync.patient.domain.valueobject.RelationshipType;
import java.time.Instant;
import java.util.UUID;

public record GuardianResponse(
    UUID id,
    UUID patientId,
    String guardianUserId,
    String fullName,
    RelationshipType relationshipType,
    String email,
    String phone,
    boolean primaryContact,
    Instant createdAt
) { }