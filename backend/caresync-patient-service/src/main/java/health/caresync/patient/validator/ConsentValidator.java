package health.caresync.patient.validator;

import health.caresync.common.exception.ValidationException;
import health.caresync.patient.domain.valueobject.ConsentType;
import health.caresync.patient.dto.ConsentCreateRequest;
import health.caresync.patient.dto.ConsentUpdateRequest;
import java.time.Instant;
import org.springframework.stereotype.Component;

@Component
public class ConsentValidator {
    public void validateCreate(ConsentCreateRequest request, Instant now) {
        if (request == null) {
            throw new ValidationException("Consent request is required");
        }
        try {
            new ConsentType(request.consentType());
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Consent type is invalid");
        }
        if (request.purpose() == null || request.purpose().isBlank() || request.purpose().length() > 2000) {
            throw new ValidationException("Consent purpose must contain between 1 and 2000 characters");
        }
        if (request.expiresAt() != null && !request.expiresAt().isAfter(now)) {
            throw new ValidationException("Consent expiry must be in the future");
        }
    }

    public void validateUpdate(ConsentUpdateRequest request, Instant now) {
        if (request == null || !request.hasChanges()) {
            throw new ValidationException("At least one consent field must be updated");
        }
        if (request.purpose() != null
            && (request.purpose().isBlank() || request.purpose().length() > 2000)) {
            throw new ValidationException("Consent purpose must contain between 1 and 2000 characters");
        }
        if (request.expiresAt() != null && !request.expiresAt().isAfter(now)) {
            throw new ValidationException("Consent expiry must be in the future");
        }
    }
}