package health.caresync.payroll.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import health.caresync.payroll.domain.EmployeeRecord;
import health.caresync.payroll.domain.Payslip;
import health.caresync.payroll.domain.SalaryStructure;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PayrollServiceTest {
    @Test
    void calculatesGrossTaxOtherDeductionsAndNetPayInCents() {
        EmployeeRecord employee = new EmployeeRecord();
        SalaryStructure salary = new SalaryStructure();
        salary.setBaseSalaryCents(250_000L);
        salary.setAllowancesCents(25_000L);
        salary.setTaxPercentage(new BigDecimal("12.50"));
        salary.setOtherDeductionPercentage(new BigDecimal("2.00"));

        Payslip payslip = PayrollService.calculate(
            UUID.randomUUID(),
            employee,
            salary,
            LocalDate.of(2026, 11, 1)
        );

        assertEquals(275_000L, payslip.getGrossPayCents());
        assertEquals(34_375L, payslip.getTaxDeductionCents());
        assertEquals(5_500L, payslip.getOtherDeductionCents());
        assertEquals(235_125L, payslip.getNetPayCents());
    }

    @Test
    void roundsFractionalCentsHalfUp() {
        EmployeeRecord employee = new EmployeeRecord();
        SalaryStructure salary = new SalaryStructure();
        salary.setBaseSalaryCents(101L);
        salary.setAllowancesCents(0L);
        salary.setTaxPercentage(new BigDecimal("12.50"));
        salary.setOtherDeductionPercentage(BigDecimal.ZERO);

        Payslip payslip = PayrollService.calculate(
            UUID.randomUUID(),
            employee,
            salary,
            LocalDate.of(2026, 11, 1)
        );

        assertEquals(13L, payslip.getTaxDeductionCents());
        assertEquals(88L, payslip.getNetPayCents());
    }
}
