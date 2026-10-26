package health.caresync.patient.dto;
import java.time.Instant;
import java.util.UUID;
public record ProviderResponse(
    UUID id,
    String firstName,
    String lastName,
    String specialty,
    boolean active,
    String email,
    String phoneNumber,
    String licenseNumber,
    String npi,
    Integer yearsOfExperience,
    String bio,
    Instant createdAt
) { }