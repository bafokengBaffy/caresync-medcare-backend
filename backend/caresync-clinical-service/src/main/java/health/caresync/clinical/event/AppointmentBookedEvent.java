package health.caresync.clinical.event;

import java.time.Instant;
import java.util.UUID;

public record AppointmentBookedEvent(
    UUID tenantId,
    UUID appointmentId,
    UUID patientId,
    UUID providerId,
    Instant scheduledStart,
    Instant scheduledEnd,
    String appointmentType,
    String guestName,
    String guestEmail,
    String guestPhone,
    String guestLocation
) { }
