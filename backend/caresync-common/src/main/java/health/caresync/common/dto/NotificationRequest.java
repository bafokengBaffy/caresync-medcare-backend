package health.caresync.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotificationRequest(
        @NotBlank String recipientId,
        @NotBlank String channel,
        @NotBlank @Size(max=200) String subject,
        @NotBlank @Size(max=2000) String body
) {}