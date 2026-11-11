package health.caresync.billing.validator;

import health.caresync.billing.dto.PackageBillingRequest;
import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PackageBillingValidator {

    private static final BigDecimal HARD_MAX = new BigDecimal("1000000.00");

    public void validate(PackageBillingRequest req) {
        if (req == null) throw new ValidationException("request is required");
        if (req.grossPrice() == null || req.grossPrice().signum() <= 0) {
            throw new ValidationException("grossPrice must be positive");
        }
        if (req.grossPrice().compareTo(HARD_MAX) > 0) {
            throw new ValidationException("grossPrice out of allowed range");
        }
        if (req.discountAmount() == null || req.discountAmount().signum() < 0) {
            throw new ValidationException("discountAmount must be >= 0");
        }
        if (req.discountAmount().compareTo(req.grossPrice()) > 0) {
            throw new ValidationException("discountAmount cannot exceed grossPrice");
        }
        if (req.totalSessions() < 1 || req.totalSessions() > 1000) {
            throw new ValidationException("totalSessions out of allowed range");
        }
        if (req.discountType() == null) {
            throw new ValidationException("discountType is required");
        }
        if (req.paymentRoute() == null) {
            throw new ValidationException("paymentRoute is required");
        }
    }
}