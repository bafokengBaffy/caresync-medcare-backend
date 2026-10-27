package health.caresync.patient.event;

import java.util.UUID;

public record PatientPreferenceUpdatedEvent(UUID tenantId, UUID patientId, String actorUserId) { }