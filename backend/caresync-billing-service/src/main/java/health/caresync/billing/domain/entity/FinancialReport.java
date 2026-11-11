package health.caresync.billing.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Immutable financial report aggregate.
 *
 * OWASP notes:
 * - Reports are append-only: no setters, only creation fields.
 * - `tenantId` is part of every row -> enforced by RLS + service check (A01).
 * - Money uses BigDecimal, never float/double (A04).
 */
@Entity
@Table(
        name = "financial_reports",
        indexes = {
                @Index(name = "idx_fin_report_tenant_period", columnList = "tenant_id, period_start, period_end"),
                @Index(name = "idx_fin_report_created", columnList = "created_at")
        }
)
public class FinancialReport {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id = UUID.randomUUID().toString();

    @NotBlank
    @Column(name = "tenant_id", nullable = false, updatable = false, length = 64)
    private String tenantId;

    @NotBlank
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be ISO-4217 3-letter code")
    @Column(name = "currency", nullable = false, updatable = false, length = 3)
    private String currency;

    @NotNull
    @Column(name = "period_start", nullable = false, updatable = false)
    private Instant periodStart;

    @NotNull
    @Column(name = "period_end", nullable = false, updatable = false)
    private Instant periodEnd;

    @NotNull
    @Column(name = "total_invoiced", nullable = false, precision = 19, scale = 2, updatable = false)
    private BigDecimal totalInvoiced = BigDecimal.ZERO;

    @NotNull
    @Column(name = "total_paid", nullable = false, precision = 19, scale = 2, updatable = false)
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @NotNull
    @Column(name = "total_outstanding", nullable = false, precision = 19, scale = 2, updatable = false)
    private BigDecimal totalOutstanding = BigDecimal.ZERO;

    @NotNull
    @Column(name = "total_refunds", nullable = false, precision = 19, scale = 2, updatable = false)
    private BigDecimal totalRefunds = BigDecimal.ZERO;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @NotBlank
    @Column(name = "created_by", nullable = false, updatable = false, length = 128)
    private String createdBy;

    /** JPA only. */
    protected FinancialReport() {}

    public FinancialReport(String tenantId, String currency, Instant periodStart, Instant periodEnd,
                           BigDecimal totalInvoiced, BigDecimal totalPaid, BigDecimal totalOutstanding,
                           BigDecimal totalRefunds, String createdBy) {
        this.tenantId = tenantId;
        this.currency = currency;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.totalInvoiced = totalInvoiced;
        this.totalPaid = totalPaid;
        this.totalOutstanding = totalOutstanding;
        this.totalRefunds = totalRefunds;
        this.createdBy = createdBy;
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getCurrency() { return currency; }
    public Instant getPeriodStart() { return periodStart; }
    public Instant getPeriodEnd() { return periodEnd; }
    public BigDecimal getTotalInvoiced() { return totalInvoiced; }
    public BigDecimal getTotalPaid() { return totalPaid; }
    public BigDecimal getTotalOutstanding() { return totalOutstanding; }
    public BigDecimal getTotalRefunds() { return totalRefunds; }
    public Instant getCreatedAt() { return createdAt; }
    public String getCreatedBy() { return createdBy; }
}