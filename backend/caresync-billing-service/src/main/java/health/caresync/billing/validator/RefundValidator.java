package health.caresync.billing.validator;

import health.caresync.billing.dto.RefundRequest;
import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

@Component
public class RefundValidator {

    private static final long HARD_MAX_AMOUNT_CENTS = 10_000_000_000L;

    public void validate(RefundRequest req) {
        if (req == null) throw new ValidationException("request is required");
        if (req.amountCents() <= 0) {
            throw new ValidationException("refund amount must be positive");
        }
        if (req.amountCents() > HARD_MAX_AMOUNT_CENTS) {
            throw new ValidationException("refund amount out of allowed range");
        }
        if (req.reason() == null || req.reason().isBlank()) {
            throw new ValidationException("reason is required");
        }
        if (req.reason().length() > 500) {
            throw new ValidationException("reason exceeds maximum length");
        }
    }
}