package health.caresync.patient.mapper;

import health.caresync.patient.domain.entity.PatientPreference;
import health.caresync.patient.dto.PatientPreferenceResponse;
import org.springframework.stereotype.Component;

@Component
public class PatientPreferenceMapper {
    public PatientPreferenceResponse toResponse(PatientPreference preference) {
        return new PatientPreferenceResponse(
            preference.getId(),
            preference.getPatientId(),
            preference.getPreferredContactMethod(),
            preference.getPreferredLanguage(),
            preference.getTimeZone(),
            preference.getAccessibilityNeeds(),
            preference.isEmailRemindersEnabled(),
            preference.isSmsRemindersEnabled(),
            preference.isPhoneRemindersEnabled(),
            preference.getVersion(),
            preference.getUpdatedAt()
        );
    }
}