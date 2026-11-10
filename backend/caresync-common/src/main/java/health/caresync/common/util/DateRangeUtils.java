package health.caresync.common.util;

import java.time.LocalDate;
import java.time.Period;
import java.util.Objects;

/**
 * Utility class for handling date ranges (e.g., billing periods, reports).
 * OWASP Alignment: Ensures date boundaries are calculated securely and accurately
 * to prevent logical bypasses in reporting or billing.
 */
public final class DateRangeUtils {

    private DateRangeUtils() {}

    /**
     * Calculates age based on date of birth.
     */
    public static int calculateAge(LocalDate dateOfBirth) {
        Objects.requireNonNull(dateOfBirth, "dateOfBirth is required");
        LocalDate today = LocalDate.now();
        if (dateOfBirth.isAfter(today)) {
            throw new IllegalArgumentException("dateOfBirth must not be in the future");
        }
        return Period.between(dateOfBirth, today).getYears();
    }

    /**
     * Generates the start date of the current month.
     */
    public static LocalDate getStartOfCurrentMonth() {
        return LocalDate.now().withDayOfMonth(1);
    }

    /**
     * Generates the end date of the current month.
     */
    public static LocalDate getEndOfCurrentMonth() {
        LocalDate now = LocalDate.now();
        return now.withDayOfMonth(now.lengthOfMonth());
    }

    /**
     * Validates that a start date is before or equal to an end date.
     */
    public static boolean isValidRange(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return false;
        }
        return !start.isAfter(end);
    }
}
