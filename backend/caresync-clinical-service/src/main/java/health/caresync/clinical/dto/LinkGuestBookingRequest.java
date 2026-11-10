package health.caresync.clinical.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record LinkGuestBookingRequest(@NotNull UUID patientId) { }
