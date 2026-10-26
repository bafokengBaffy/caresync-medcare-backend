package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record AppointmentCreateRequest(
    @NotNull UUID patientId,
    @NotNull UUID providerId,
    @NotNull Instant scheduledStart,
    @NotNull Instant scheduledEnd,
    String appointmentType
) {
}
