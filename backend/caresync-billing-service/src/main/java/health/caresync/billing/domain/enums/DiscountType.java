package health.caresync.billing.domain.enums;

/**
 * Discount classification. Whitelist enum -> safe for switch/DB.
 */
public enum DiscountType {
    NONE,
    PERCENTAGE,
    FIXED_AMOUNT,
    SLIDING_SCALE,
    PRO_BONO
}