package health.caresync.patient.event;
import java.util.UUID;
public record PatientCreatedEvent(UUID patientId, UUID tenantId) { }