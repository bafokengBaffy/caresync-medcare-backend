package health.caresync.common;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import health.caresync.common.util.MoneyUtils;
import java.math.BigDecimal;
class MoneyUtilsTest {
    @Test void centsRoundTrip() { assertEquals(BigDecimal.valueOf(1234,2), MoneyUtils.fromCents(1234)); }
}