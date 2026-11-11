package health.caresync.common.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ConsentRequest(
        @NotBlank String patientId,
        List<String> consentTypes,
        String reason
) {}