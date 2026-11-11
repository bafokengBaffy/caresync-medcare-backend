package health.caresync.common.validation;

import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

@Component
public class PackageBalanceValidator {

    public void requireAvailable(int totalSessions, int usedSessions) {
        if (totalSessions < 0 || usedSessions < 0 || usedSessions > totalSessions) {
            throw new ValidationException("invalid package balance");
        }
        if (usedSessions >= totalSessions) {
            throw new ValidationException("package exhausted");
        }
    }
}