package health.caresync.common.dto;
import java.util.UUID;
public record PatientSummary(UUID id, String firstName, String lastName) { }