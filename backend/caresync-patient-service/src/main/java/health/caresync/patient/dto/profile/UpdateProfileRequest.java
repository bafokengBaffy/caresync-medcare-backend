package health.caresync.patient.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank
    @Size(max = 200)
    String fullName,
    @Size(max = 32)
    @Pattern(regexp = "[+0-9(). -]*")
    String phone
) { }
