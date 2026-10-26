package health.caresync.clinical.dto;

import health.caresync.clinical.domain.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public record AppointmentStatusRequest(@NotNull AppointmentStatus status) {
}
