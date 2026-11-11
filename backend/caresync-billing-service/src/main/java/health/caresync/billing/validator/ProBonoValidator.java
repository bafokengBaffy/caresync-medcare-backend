package health.caresync.billing.validator;

import health.caresync.billing.dto.ProBonoRequest;
import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

@Component
public class ProBonoValidator {

    private static final int MAX_REASON = 500;

    public void validate(ProBonoRequest req) {
        if (req == null) throw new ValidationException("request is required");
        if (req.patientId() == null || req.patientId().isBlank()) {
            throw new ValidationException("patientId is required");
        }
        if (req.serviceCode() == null || req.serviceCode().isBlank()) {
            throw new ValidationException("serviceCode is required");
        }
        if (req.reason() == null || req.reason().isBlank()) {
            throw new ValidationException("reason is required");
        }
        if (req.reason().length() > MAX_REASON) {
            throw new ValidationException("reason exceeds maximum length");
        }
    }
}