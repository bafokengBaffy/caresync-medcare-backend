package health.caresync.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientPreferenceRequest(
    @NotBlank @Pattern(regexp = "EMAIL|SMS|PHONE|POST") String preferredContactMethod,
    @NotBlank @Size(max = 35) @Pattern(regexp = "[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*")
        String preferredLanguage,
    @NotBlank @Size(max = 64) String timeZone,
    @Size(max = 2000) String accessibilityNeeds,
    @NotNull Boolean emailRemindersEnabled,
    @NotNull Boolean smsRemindersEnabled,
    @NotNull Boolean phoneRemindersEnabled
) { }