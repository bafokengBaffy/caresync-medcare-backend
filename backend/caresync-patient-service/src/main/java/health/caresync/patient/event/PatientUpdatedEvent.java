package health.caresync.patient.event;
import java.util.UUID;
public record PatientUpdatedEvent(UUID patientId, UUID tenantId) { }