package health.caresync.billing.validator;

import health.caresync.billing.dto.MedicalAidClaimRequest;
import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

/**
 * Defense-in-depth validator (in addition to Bean Validation).
 * OWASP A03/A04: reject anything unexpected.
 */
@Component
public class MedicalAidClaimValidator {

    private static final long HARD_MAX_AMOUNT_CENTS = 10_000_000_000L;

    public void validate(MedicalAidClaimRequest req) {
        if (req == null) throw new ValidationException("request is required");
        if (req.claimAmountCents() <= 0) {
            throw new ValidationException("claimAmountCents must be positive");
        }
        if (req.claimAmountCents() > HARD_MAX_AMOUNT_CENTS) {
            throw new ValidationException("claimAmountCents out of allowed range");
        }
        if (req.invoiceId() == null) {
            throw new ValidationException("invoiceId is required");
        }
        if (req.providerName() == null || req.providerName().isBlank()) {
            throw new ValidationException("providerName is required");
        }
        if (req.memberNumber() == null || req.memberNumber().isBlank()) {
            throw new ValidationException("memberNumber is required");
        }
    }
}