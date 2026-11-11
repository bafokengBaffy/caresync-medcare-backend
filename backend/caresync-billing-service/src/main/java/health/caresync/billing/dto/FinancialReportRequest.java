package health.caresync.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.Instant;

/**
 * Request to generate a financial report.
 *
 * OWASP notes:
 * - Strict field whitelist; no `tenantId` from client -> server derives from security context.
 * - Period validated (start < end) in validator layer.
 */
public record FinancialReportRequest(
        @NotNull Instant periodStart,
        @NotNull Instant periodEnd,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currency
) {}