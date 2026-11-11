package health.caresync.billing.domain.enums;

/**
 * How a charge is funded. Whitelist enum.
 */
public enum PaymentRoute {
    PRIVATE,
    MEDICAL_AID,
    MIXED,
    PRO_BONO
}