package health.caresync.common.util;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Utility class for date/time operations, specifically tailored for clinical and billing contexts.
 * OWASP Alignment: Standardizes timezones (UTC) to prevent "time-travel" logic bypasses 
 * and ensures audit logs have consistent timestamps.
 */
public final class DateTimeUtils {

    public static final String ISO_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern(ISO_DATE_TIME_FORMAT).withZone(ZoneOffset.UTC);

    private DateTimeUtils() {}

    /**
     * Returns the current instant in UTC.
     */
    public static Instant now() {
        return Instant.now();
    }

    /**
     * Returns the current date in UTC (useful for billing periods).
     */
    public static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    /**
     * Formats an Instant to an ISO-8601 string in UTC.
     */
    public static String formatIso(Instant instant) {
        if (instant == null) return null;
        return ISO_FORMATTER.format(instant);
    }

    /**
     * Calculates the number of days between two dates (e.g., for package expiry).
     */
    public static long daysBetween(LocalDate start, LocalDate end) {
        return ChronoUnit.DAYS.between(start, end);
    }

    /**
     * Checks if a given date is in the past (e.g., for token or package expiry).
     */
    public static boolean isExpired(Instant expiryDate) {
        return expiryDate != null && expiryDate.isBefore(now());
    }
}
