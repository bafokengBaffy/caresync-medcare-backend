package health.caresync.common.validation;

import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

@Component
public class SpecialtyValidator {

    public void validate(String specialty) {
        if (specialty == null || specialty.isBlank() || specialty.length() > 100) {
            throw new ValidationException("invalid specialty");
        }
    }
}