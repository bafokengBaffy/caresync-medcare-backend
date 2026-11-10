package health.caresync.clinical.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record AnonymousOnlineBookingRequest(
    @NotNull UUID providerId,
    @NotNull Instant scheduledStart,
    @NotNull Instant scheduledEnd,
    @Size(max = 50) String appointmentType,
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Email @Size(max = 320) String email,
    @NotBlank @Size(max = 32) String phone,
    @Size(max = 500) String location
) { }
