package health.caresync.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator for Lesotho National ID format.
 * OWASP Alignment: Strict input validation prevents malformed data and 
 * potential injection vectors via the ID field.
 */
public class IdNumberValidator implements ConstraintValidator<ValidIdNumber, String> {

    // Lesotho ID numbers are typically 12-13 digits
    private static final Pattern ID_PATTERN = Pattern.compile("^\\d{12,13}$");

    @Override
    public boolean isValid(String idNumber, ConstraintValidatorContext context) {
        if (idNumber == null || idNumber.isBlank()) {
            return true; // Let @NotNull handle nullability
        }
        return ID_PATTERN.matcher(idNumber.trim()).matches();
    }
}
