package health.caresync.patient.dto;
import java.util.UUID;
public record ProviderResponse(UUID id, String firstName, String lastName, String specialty, boolean active) { }