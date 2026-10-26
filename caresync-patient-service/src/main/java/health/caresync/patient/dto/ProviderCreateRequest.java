package health.caresync.patient.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.PositiveOrZero;
public record ProviderCreateRequest(@NotBlank String userId, @NotBlank String firstName, @NotBlank String lastName,
                                    @NotBlank String specialty, String licenseNumber, @Email String email,
                                    String phoneNumber, String npi, @PositiveOrZero Integer yearsOfExperience,
                                    String bio) { }