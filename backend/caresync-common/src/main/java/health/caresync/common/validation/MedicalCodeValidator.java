package health.caresync.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator for standard medical codes (ICD-10, CPT, or internal CareSync codes).
 * OWASP Alignment: Prevents code injection and ensures only approved 
 * alphanumeric formats are accepted into clinical records.
 */
public class MedicalCodeValidator implements ConstraintValidator<ValidMedicalCode, String> {

    // Allows formats like: ICD-10 (A00.0), CPT (99213), or CareSync (DENT-EXAM)
    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z0-9\\-\\.]{2,20}$");

    @Override
    public boolean isValid(String code, ConstraintValidatorContext context) {
        if (code == null || code.isBlank()) {
            return true;
        }
        return CODE_PATTERN.matcher(code.trim().toUpperCase()).matches();
    }
}
