package health.caresync.common.security;

import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/** NIST-aligned password policy (OWASP A07). */
@Component
public class PasswordPolicyValidator {

    private static final int MIN_LEN = 12;
    private static final int MAX_LEN = 128;
    private static final Pattern HAS_UPPER = Pattern.compile("[A-Z]");
    private static final Pattern HAS_LOWER = Pattern.compile("[a-z]");
    private static final Pattern HAS_DIGIT = Pattern.compile("[0-9]");
    private static final Pattern HAS_SPECIAL = Pattern.compile("[^A-Za-z0-9]");

    public void validate(String password) {
        if (password == null || password.length() < MIN_LEN || password.length() > MAX_LEN) {
            throw new ValidationException("password length must be 12-128");
        }
        if (!HAS_UPPER.matcher(password).find()
                || !HAS_LOWER.matcher(password).find()
                || !HAS_DIGIT.matcher(password).find()
                || !HAS_SPECIAL.matcher(password).find()) {
            throw new ValidationException(
                    "password must include upper, lower, digit, and special character");
        }
    }
}