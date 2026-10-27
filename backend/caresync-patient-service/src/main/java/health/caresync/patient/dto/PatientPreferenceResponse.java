package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientPreferenceResponse(
    UUID id,
    UUID patientId,
    String preferredContactMethod,
    String preferredLanguage,
    String timeZone,
    String accessibilityNeeds,
    boolean emailRemindersEnabled,
    boolean smsRemindersEnabled,
    boolean phoneRemindersEnabled,
    long version,
    Instant updatedAt
) { }