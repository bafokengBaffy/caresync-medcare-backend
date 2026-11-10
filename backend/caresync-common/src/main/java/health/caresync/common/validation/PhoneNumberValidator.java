package health.caresync.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator for international phone numbers (specifically tailored for Lesotho +266).
 * OWASP Alignment: Prevents injection attacks via unvalidated input strings 
 * and ensures data integrity before persisting to the database.
 */
public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^(?:\\+266)?\\d{8}$");

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return true; // Let @NotNull handle nullability
        }
        String sanitized = phoneNumber.replaceAll("[\\s-]", "");
        return PHONE_PATTERN.matcher(sanitized).matches();
    }
}
