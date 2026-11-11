package health.caresync.common.dto;

import java.time.Instant;

public record NotificationResponse(
        String id, String status, Instant createdAt
) {}