package health.caresync.patient.dto;
import java.util.UUID;
public record PatientSummaryResponse(UUID id, String firstName, String lastName) { }