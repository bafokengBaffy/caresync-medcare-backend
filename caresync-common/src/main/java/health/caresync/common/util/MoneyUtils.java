package health.caresync.common.util;
import java.math.BigDecimal;
public final class MoneyUtils {
    public static BigDecimal fromCents(long cents) { return BigDecimal.valueOf(cents, 2); }
    public static long toCents(BigDecimal amount) { return amount.movePointRight(2).longValueExact(); }
    private MoneyUtils() { }
}