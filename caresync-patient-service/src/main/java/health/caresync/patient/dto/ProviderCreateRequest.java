package health.caresync.patient.dto;
import jakarta.validation.constraints.NotBlank;
public record ProviderCreateRequest(@NotBlank String userId, @NotBlank String firstName, @NotBlank String lastName,
                                    @NotBlank String specialty, String licenseNumber) { }