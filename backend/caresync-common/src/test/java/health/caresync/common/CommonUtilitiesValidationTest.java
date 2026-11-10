package health.caresync.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import health.caresync.common.util.CurrencyUtils;
import health.caresync.common.util.DateRangeUtils;
import health.caresync.common.util.MaskingUtils;
import health.caresync.common.validation.PhoneNumberValidator;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class CommonUtilitiesValidationTest {
    private final PhoneNumberValidator phoneNumberValidator = new PhoneNumberValidator();

    @Test
    void parsesCurrencyAmountsWithoutSilentlyChangingTheirSignOrDigits() {
        assertEquals(new BigDecimal("1234.50"), CurrencyUtils.parse("M 1,234.50"));
        assertEquals(new BigDecimal("-12.30"), CurrencyUtils.parse("$-12.30"));
        assertEquals(new BigDecimal("10"), CurrencyUtils.parse("LSL 10"));
    }

    @Test
    void rejectsMalformedCurrencyAmounts() {
        assertThrows(IllegalArgumentException.class, () -> CurrencyUtils.parse("1,2.00"));
        assertThrows(IllegalArgumentException.class, () -> CurrencyUtils.parse("1.2.3"));
        assertThrows(IllegalArgumentException.class, () -> CurrencyUtils.parse("$"));
    }

    @Test
    void masksSensitiveValuesWithoutExposingShortInputs() {
        assertEquals("j***e@example.test", MaskingUtils.maskEmail("jane@example.test"));
        assertEquals("****", MaskingUtils.maskEmail("malformed"));
        assertEquals("+266 5*** **34", MaskingUtils.maskPhone("+266 5800 1234"));
        assertEquals("****4321", MaskingUtils.maskIdNumber("1234564321"));
    }

    @Test
    void validatesLesothoLocalAndInternationalPhoneNumbers() {
        assertTrue(phoneNumberValidator.isValid("58001234", null));
        assertTrue(phoneNumberValidator.isValid("+266 5800-1234", null));
        assertTrue(phoneNumberValidator.isValid(null, null));
        assertFalse(phoneNumberValidator.isValid("2658001234", null));
        assertFalse(phoneNumberValidator.isValid("+265 58001234", null));
        assertFalse(phoneNumberValidator.isValid("5800abcd", null));
    }

    @Test
    void checksInclusiveDateRangesAndRejectsFutureBirthDates() {
        LocalDate date = LocalDate.of(2026, 5, 1);
        assertTrue(DateRangeUtils.isValidRange(date, date));
        assertFalse(DateRangeUtils.isValidRange(date.plusDays(1), date));
        assertFalse(DateRangeUtils.isValidRange(null, date));
        assertThrows(
            IllegalArgumentException.class,
            () -> DateRangeUtils.calculateAge(LocalDate.now().plusDays(1))
        );
    }
}
