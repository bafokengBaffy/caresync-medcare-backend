package health.caresync.payroll.service;

import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.payroll.domain.EmployeeRecord;
import health.caresync.payroll.domain.Payslip;
import health.caresync.payroll.domain.SalaryStructure;
import health.caresync.payroll.repository.EmployeeRecordRepository;
import health.caresync.payroll.repository.PayslipRepository;
import health.caresync.payroll.repository.SalaryStructureRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayrollService {
    private static final BigDecimal PERCENTAGE_BASE = BigDecimal.valueOf(100);

    private final EmployeeRecordRepository employees;
    private final SalaryStructureRepository salaryStructures;
    private final PayslipRepository payslips;
    private final TenantRlsContext tenantRlsContext;

    public PayrollService(
        EmployeeRecordRepository employees,
        SalaryStructureRepository salaryStructures,
        PayslipRepository payslips,
        TenantRlsContext tenantRlsContext
    ) {
        this.employees = employees;
        this.salaryStructures = salaryStructures;
        this.payslips = payslips;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public List<Payslip> runPayrollForTenant(UUID tenantId, YearMonth period) {
        tenantRlsContext.applyPublicTenant(tenantId);
        LocalDate periodStart = period.atDay(1);
        List<EmployeeRecord> activeEmployees =
            employees.findAllByTenantIdAndActiveTrueOrderByEmployeeCode(tenantId);

        for (EmployeeRecord employee : activeEmployees) {
            if (payslips.existsByTenantIdAndEmployeeIdAndPayPeriodStart(
                tenantId,
                employee.getId(),
                periodStart
            )) {
                continue;
            }
            SalaryStructure salary = salaryStructures
                .findCurrentForEmployee(tenantId, employee.getId(), period.atEndOfMonth())
                .orElseThrow(() -> new ValidationException(
                    "No active salary structure for employee " + employee.getEmployeeCode()
                ));
            payslips.save(calculate(tenantId, employee, salary, periodStart));
        }

        return payslips.findAllByTenantIdAndPayPeriodStartOrderByEmployeeId(tenantId, periodStart);
    }

    static Payslip calculate(
        UUID tenantId,
        EmployeeRecord employee,
        SalaryStructure salary,
        LocalDate periodStart
    ) {
        validateSalary(salary);
        long gross;
        try {
            gross = Math.addExact(salary.getBaseSalaryCents(), salary.getAllowancesCents());
        } catch (ArithmeticException e) {
            throw new ValidationException("Gross pay exceeds the supported amount");
        }
        long tax = percentageOf(gross, salary.getTaxPercentage());
        long otherDeductions = percentageOf(gross, salary.getOtherDeductionPercentage());
        long deductions;
        try {
            deductions = Math.addExact(tax, otherDeductions);
        } catch (ArithmeticException e) {
            throw new ValidationException("Payroll deductions exceed the supported amount");
        }
        if (deductions > gross) {
            throw new ValidationException("Total payroll deductions cannot exceed gross pay");
        }

        Payslip payslip = new Payslip();
        payslip.setTenantId(tenantId);
        payslip.setEmployeeId(employee.getId());
        payslip.setSalaryStructureId(salary.getId());
        payslip.setPayPeriodStart(periodStart);
        payslip.setGrossPayCents(gross);
        payslip.setTaxDeductionCents(tax);
        payslip.setOtherDeductionCents(otherDeductions);
        payslip.setNetPayCents(gross - deductions);
        return payslip;
    }

    private static long percentageOf(long amount, BigDecimal percentage) {
        try {
            return BigDecimal.valueOf(amount)
                .multiply(percentage)
                .divide(PERCENTAGE_BASE, 0, RoundingMode.HALF_UP)
                .longValueExact();
        } catch (ArithmeticException e) {
            throw new ValidationException("Payroll amount exceeds the supported range");
        }
    }

    private static void validateSalary(SalaryStructure salary) {
        if (salary.getBaseSalaryCents() < 0 || salary.getAllowancesCents() < 0) {
            throw new ValidationException("Salary and allowances cannot be negative");
        }
        BigDecimal taxRate = salary.getTaxPercentage();
        BigDecimal otherRate = salary.getOtherDeductionPercentage();
        if (taxRate == null || otherRate == null
            || taxRate.compareTo(BigDecimal.ZERO) < 0
            || otherRate.compareTo(BigDecimal.ZERO) < 0
            || taxRate.add(otherRate).compareTo(PERCENTAGE_BASE) > 0) {
            throw new ValidationException("Payroll deduction rates must be valid and total at most 100%");
        }
    }
}
