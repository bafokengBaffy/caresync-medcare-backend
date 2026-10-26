package health.caresync.clinical.dto;

import health.caresync.common.dto.Specialty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ClinicalNoteCreateRequest(
    @NotNull UUID patientId,
    @NotNull UUID providerId,
    @NotNull UUID appointmentId,
    @NotNull Specialty specialty,
    @NotBlank String noteType,
    @NotNull @Valid SoapDataRequest soapData
) {
}
