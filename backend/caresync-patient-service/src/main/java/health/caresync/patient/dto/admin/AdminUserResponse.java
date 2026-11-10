package health.caresync.patient.dto.admin;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminUserResponse(
    String firebaseUid,
    String email,
    String fullName,
    String phone,
    String profileImageUrl,
    UUID tenantId,
    String role,
    String status,
    String providerId,
    List<String> permissions,
    Instant createdAt
) { }
