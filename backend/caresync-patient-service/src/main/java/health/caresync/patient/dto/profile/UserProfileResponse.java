package health.caresync.patient.dto.profile;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
    String firebaseUid,
    String fullName,
    String phone,
    String email,
    String profileImageUrl,
    String role,
    UUID tenantId,
    String tenantName,
    Instant createdAt,
    Instant updatedAt
) { }
