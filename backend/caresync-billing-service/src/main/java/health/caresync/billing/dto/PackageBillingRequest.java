package health.caresync.billing.dto;

import health.caresync.billing.domain.enums.DiscountType;
import health.caresync.billing.domain.enums.PaymentRoute;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Create a package billing record.
 *
 * OWASP notes:
 * - No tenantId / id from client (server-derived).
 * - All monetary & numeric bounds enforced.
 * - packageCode uses strict charset.
 */
public record PackageBillingRequest(
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9_\\-]{1,64}$") String patientId,
        @NotBlank @Pattern(regexp = "^[A-Z0-9_\\-]{1,64}$") String packageCode,
        @NotNull @DecimalMin("0.01") @DecimalMax("1000000.00") BigDecimal grossPrice,
        @NotNull @DecimalMin("0.00") BigDecimal discountAmount,
        @NotNull DiscountType discountType,
        @NotNull PaymentRoute paymentRoute,
        @Min(1) @Max(1000) int totalSessions
) {}