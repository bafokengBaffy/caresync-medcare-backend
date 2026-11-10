package health.caresync.patient.dto.admin;

import java.time.Instant;
import java.util.UUID;

public record RegistrationRequestResponse(
    UUID id,
    String email,
    String firebaseUid,
    String requestedRole,
    UUID requestedTenantId,
    String status,
    Instant submittedAt,
    String reviewedBy,
    Instant reviewedAt,
    String rejectionReason
) { }
