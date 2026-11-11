package health.caresync.billing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Externalized configuration for package billing rules.
 *
 * OWASP notes:
 * - All monetary bounds are validated at startup -> fail fast, no silent misconfig.
 * - Never trust runtime user input for pricing defaults; these are the ONLY allowed defaults.
 */
@Configuration
@Validated
@ConfigurationProperties(prefix = "caresync.billing.package")
public class PackageBillingConfig {

    /** Max discount as a fraction (0.30 = 30%). */
    @NotNull
    @DecimalMin("0.00")
    @DecimalMax("0.90")
    private BigDecimal maxDiscountFraction = BigDecimal.ZERO;

    /** Whether partial redemption is allowed. */
    private boolean partialRedemptionAllowed = true;

    /** Minimum fraction of a package that must be consumed before refund. */
    @NotNull
    @DecimalMin("0.00")
    @DecimalMax("1.00")
    private BigDecimal minConsumedFractionForRefund = new BigDecimal("0.50");

    /** Currency used for all package prices (ISO 4217). */
    @NotNull
    private String currency = "ZAR";

    /** Cap on package price to prevent absurd values (OWASP A04). */
    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("1000000.00")
    private BigDecimal maxPackagePrice = new BigDecimal("1000000.00");

    // getters/setters
    public BigDecimal getMaxDiscountFraction() { return maxDiscountFraction; }
    public void setMaxDiscountFraction(BigDecimal v) { this.maxDiscountFraction = v; }

    public boolean isPartialRedemptionAllowed() { return partialRedemptionAllowed; }
    public void setPartialRedemptionAllowed(boolean v) { this.partialRedemptionAllowed = v; }

    public BigDecimal getMinConsumedFractionForRefund() { return minConsumedFractionForRefund; }
    public void setMinConsumedFractionForRefund(BigDecimal v) { this.minConsumedFractionForRefund = v; }

    public String getCurrency() { return currency; }
    public void setCurrency(String v) { this.currency = v; }

    public BigDecimal getMaxPackagePrice() { return maxPackagePrice; }
    public void setMaxPackagePrice(BigDecimal v) { this.maxPackagePrice = v; }
}