package health.caresync.patient.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public record PatientUpdateRequest(
    @Pattern(regexp = ".*\\S.*") String firstName,
    @Pattern(regexp = ".*\\S.*") String lastName,
    String gender,
    @Email String email,
    String phone,
    String address
) { }