package health.caresync.patient.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileImageRequest(
    @NotBlank
    @Size(max = 2048)
    String publicUrl
) { }
