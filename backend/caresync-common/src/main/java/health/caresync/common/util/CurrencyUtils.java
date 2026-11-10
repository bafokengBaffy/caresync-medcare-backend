package health.caresync.common.util;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class for currency formatting and validation.
 * OWASP Alignment: Standardizes currency parsing to prevent locale-based
 * parsing vulnerabilities and ensures consistent display of financial data.
 */
public final class CurrencyUtils {

    public static final Currency DEFAULT_CURRENCY = Currency.getInstance("LSL"); // Lesotho Loti
    private static final Pattern AMOUNT = Pattern.compile(
        "^[+-]?(?:\\d+|\\d{1,3}(?:,\\d{3})+)(?:\\.\\d{1,2})?$"
    );
    private static final Pattern CURRENCY_PREFIX = Pattern.compile(
        "^(?:LSL|M|[$])\\s*",
        Pattern.CASE_INSENSITIVE
    );

    private CurrencyUtils() {}

    /**
     * Formats a monetary amount into a localized currency string.
     */
    public static String format(BigDecimal amount, Locale locale) {
        if (amount == null) {
            return NumberFormat.getCurrencyInstance(locale != null ? locale : Locale.US)
                .format(BigDecimal.ZERO);
        }
        NumberFormat formatter = NumberFormat.getCurrencyInstance(locale != null ? locale : Locale.US);
        formatter.setCurrency(DEFAULT_CURRENCY);
        return formatter.format(amount);
    }

    /**
     * Safely parses a string into a BigDecimal, throwing a ValidationException if invalid.
     */
    public static BigDecimal parse(String amountString) {
        if (amountString == null || amountString.isBlank()) {
            throw new IllegalArgumentException("Amount string cannot be empty");
        }
        String normalized = CURRENCY_PREFIX.matcher(amountString.trim()).replaceFirst("").trim();
        Matcher matcher = AMOUNT.matcher(normalized);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid monetary amount format");
        }
        return new BigDecimal(normalized.replace(",", ""));
    }
}
