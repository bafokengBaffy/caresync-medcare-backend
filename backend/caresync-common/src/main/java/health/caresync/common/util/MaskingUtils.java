package health.caresync.common.util;

/**
 * Utility class to mask Sensitive Personal Information (SPI) and PHI in logs.
 * OWASP Alignment: Prevents accidental leakage of PII (Emails, Phone Numbers, IDs)
 * into application logs, which is a critical HIPAA/GDPR requirement.
 */
public final class MaskingUtils {

    private MaskingUtils() {}

    /**
     * Masks an email address (e.g., john.doe@example.com -> j***e@example.com).
     */
    public static String maskEmail(String email) {
        if (email == null) {
            return null;
        }
        int separator = email.lastIndexOf('@');
        if (separator <= 0 || separator == email.length() - 1 || email.indexOf('@') != separator) {
            return "****";
        }
        String localPart = email.substring(0, separator);
        String domain = email.substring(separator + 1);
        String maskedLocal = localPart.length() == 1
            ? "*"
            : localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1);
        return maskedLocal + "@" + domain;
    }

    /**
     * Masks a phone number (e.g., +266 5000 1234 -> +266 5*** **34).
     */
    public static String maskPhone(String phone) {
        if (phone == null) {
            return null;
        }
        int digits = 0;
        for (int i = 0; i < phone.length(); i++) {
            if (Character.isDigit(phone.charAt(i))) {
                digits++;
            }
        }
        if (digits < 5) {
            return "****";
        }

        boolean lesothoInternational = phone.startsWith("+266");
        int firstNationalDigit = lesothoInternational ? 3 : 0;
        int visibleLastDigits = 2;
        StringBuilder masked = new StringBuilder(phone.length());
        int digitIndex = 0;
        for (int i = 0; i < phone.length(); i++) {
            char character = phone.charAt(i);
            if (Character.isDigit(character)) {
                boolean countryCodeDigit = lesothoInternational && digitIndex < 3;
                boolean firstVisibleDigit = digitIndex == firstNationalDigit;
                boolean lastVisibleDigit = digitIndex >= digits - visibleLastDigits;
                masked.append(countryCodeDigit || firstVisibleDigit || lastVisibleDigit ? character : '*');
                digitIndex++;
            } else {
                masked.append(character);
            }
        }
        return masked.toString();
    }

    /**
     * Masks a national ID or Passport number.
     */
    public static String maskIdNumber(String idNumber) {
        if (idNumber == null || idNumber.length() < 4) {
            return "****";
        }
        return "****" + idNumber.substring(idNumber.length() - 4);
    }
}
