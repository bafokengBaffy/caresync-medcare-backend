package health.caresync.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Utility class for safe monetary calculations.
 * OWASP Alignment: Prevents floating-point precision issues and rounding errors
 * that could be exploited for financial fraud (e.g., siphoning off fractions of a cent).
 */
public final class MoneyUtils {

    public static final int DEFAULT_SCALE = 2;
    public static final RoundingMode DEFAULT_ROUNDING = RoundingMode.HALF_UP;

    private MoneyUtils() {}

    public static BigDecimal fromCents(long cents) {
        return BigDecimal.valueOf(cents, DEFAULT_SCALE);
    }

    /**
     * Safely adds two monetary values.
     */
    public static BigDecimal add(BigDecimal a, BigDecimal b) {
        if (a == null && b == null) return BigDecimal.ZERO;
        if (a == null) return b;
        if (b == null) return a;
        return a.add(b).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Safely subtracts two monetary values.
     */
    public static BigDecimal subtract(BigDecimal a, BigDecimal b) {
        if (a == null) a = BigDecimal.ZERO;
        if (b == null) b = BigDecimal.ZERO;
        return a.subtract(b).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Safely multiplies a monetary value by a quantity (e.g., for line items).
     */
    public static BigDecimal multiply(BigDecimal amount, int quantity) {
        if (amount == null || quantity == 0) return BigDecimal.ZERO;
        return amount.multiply(BigDecimal.valueOf(quantity)).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Applies a percentage discount to a monetary value safely.
     * @param amount The base amount
     * @param percentage The discount percentage (e.g., 10 for 10%)
     */
    public static BigDecimal applyPercentageDiscount(BigDecimal amount, BigDecimal percentage) {
        if (amount == null || percentage == null) return amount;
        if (percentage.compareTo(BigDecimal.ZERO) < 0 || percentage.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100");
        }
        BigDecimal multiplier = BigDecimal.ONE.subtract(percentage.divide(new BigDecimal("100"), 4, DEFAULT_ROUNDING));
        return amount.multiply(multiplier).setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }

    /**
     * Ensures a monetary value is non-negative.
     */
    public static BigDecimal nonNegative(BigDecimal amount) {
        Objects.requireNonNull(amount, "Amount cannot be null");
        return amount.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : amount.setScale(DEFAULT_SCALE, DEFAULT_ROUNDING);
    }
}
