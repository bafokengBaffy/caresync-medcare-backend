package health.caresync.clinical.dto;

import health.caresync.clinical.domain.AppointmentStatus;
import java.time.Instant;
import java.util.UUID;

public record AppointmentResponse(
    UUID id,
    UUID patientId,
    UUID providerId,
    Instant scheduledStart,
    Instant scheduledEnd,
    AppointmentStatus status,
    String appointmentType
) {
}
