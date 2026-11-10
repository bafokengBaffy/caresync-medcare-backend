package health.caresync.payroll.domain;

import health.caresync.common.tenant.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "payslips",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_payslips_tenant_employee_period",
        columnNames = {"tenant_id", "employee_id", "pay_period_start"}
    )
)
@EntityListeners(TenantAwareEntityListener.class)
public class Payslip implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "salary_structure_id", nullable = false)
    private UUID salaryStructureId;

    @Column(name = "pay_period_start", nullable = false)
    private LocalDate payPeriodStart;

    @Column(name = "gross_pay_cents", nullable = false)
    private long grossPayCents;

    @Column(name = "tax_deduction_cents", nullable = false)
    private long taxDeductionCents;

    @Column(name = "other_deduction_cents", nullable = false)
    private long otherDeductionCents;

    @Column(name = "net_pay_cents", nullable = false)
    private long netPayCents;

    @Column(length = 3, nullable = false)
    private String currency = "LSL";

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @PrePersist
    void onCreate() {
        generatedAt = generatedAt == null ? Instant.now() : generatedAt;
    }

    @Override
    public UUID getTenantId() { return tenantId; }

    @Override
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public UUID getId() { return id; }
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public UUID getSalaryStructureId() { return salaryStructureId; }
    public void setSalaryStructureId(UUID salaryStructureId) { this.salaryStructureId = salaryStructureId; }
    public LocalDate getPayPeriodStart() { return payPeriodStart; }
    public void setPayPeriodStart(LocalDate payPeriodStart) { this.payPeriodStart = payPeriodStart; }
    public long getGrossPayCents() { return grossPayCents; }
    public void setGrossPayCents(long grossPayCents) { this.grossPayCents = grossPayCents; }
    public long getTaxDeductionCents() { return taxDeductionCents; }
    public void setTaxDeductionCents(long taxDeductionCents) { this.taxDeductionCents = taxDeductionCents; }
    public long getOtherDeductionCents() { return otherDeductionCents; }
    public void setOtherDeductionCents(long otherDeductionCents) { this.otherDeductionCents = otherDeductionCents; }
    public long getNetPayCents() { return netPayCents; }
    public void setNetPayCents(long netPayCents) { this.netPayCents = netPayCents; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Instant getGeneratedAt() { return generatedAt; }
}
