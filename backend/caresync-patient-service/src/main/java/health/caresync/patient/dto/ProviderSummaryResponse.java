package health.caresync.patient.dto;
import java.util.UUID;
public record ProviderSummaryResponse(
    UUID id,
    String firstName,
    String lastName,
    String specialty,
    String email,
    String phoneNumber,
    String npi,
    boolean active
) { }