package health.caresync.common.util;
import java.time.Instant;
public final class DateTimeUtils {
    public static Instant now() { return Instant.now(); }
    private DateTimeUtils() { }
}