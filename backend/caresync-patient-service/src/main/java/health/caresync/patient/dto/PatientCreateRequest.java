package health.caresync.patient.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record PatientCreateRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotNull  LocalDate dateOfBirth,
    String gender, @Email String email, String phone, String address,
    String emergencyContactName, String emergencyContactPhone) { }