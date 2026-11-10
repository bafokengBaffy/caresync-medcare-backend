package health.caresync.patient.dto.portal;

import java.time.Instant;
import java.util.UUID;

public record PatientAppointmentItem(
    UUID id,
    Instant scheduledStart,
    Instant scheduledEnd,
    String status,
    String appointmentType,
    String providerName,
    String specialty
) { }
