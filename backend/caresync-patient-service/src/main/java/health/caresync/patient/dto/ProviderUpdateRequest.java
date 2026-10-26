package health.caresync.patient.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.PositiveOrZero;
public record ProviderUpdateRequest(
    String firstName,
    String lastName,
    String specialty,
    String licenseNumber,
    @Email String email,
    String phoneNumber,
    String npi,
    @PositiveOrZero Integer yearsOfExperience,
    String bio,
    Boolean active
) { }