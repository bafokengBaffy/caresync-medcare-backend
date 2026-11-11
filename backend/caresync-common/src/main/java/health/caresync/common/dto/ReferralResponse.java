package health.caresync.common.dto;

import java.time.Instant;

public record ReferralResponse(
        String id, String status, Instant createdAt, Instant updatedAt
) {}