package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record OnlineBookingRequest(
    @NotNull UUID providerId,
    @NotNull Instant scheduledStart,
    @NotNull Instant scheduledEnd,
    @Size(max = 50) String appointmentType
) { }
