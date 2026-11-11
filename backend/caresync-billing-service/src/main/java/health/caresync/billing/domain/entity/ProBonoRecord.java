package health.caresync.billing.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * Pro-bono (free care) record. Append-only.
 *
 * OWASP notes:
 * - `reason` is length-capped to prevent storage abuse / log flooding.
 * - `tenantId` immutable.
 */
@Entity
@Table(
        name = "pro_bono_records",
        indexes = {
                @Index(name = "idx_pro_bono_tenant", columnList = "tenant_id"),
                @Index(name = "idx_pro_bono_patient", columnList = "patient_id")
        }
)
public class ProBonoRecord {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id = UUID.randomUUID().toString();

    @NotBlank
    @Column(name = "tenant_id", nullable = false, updatable = false, length = 64)
    private String tenantId;

    @NotBlank
    @Column(name = "patient_id", nullable = false, updatable = false, length = 64)
    private String patientId;

    @NotBlank
    @Pattern(regexp = "^[A-Z0-9_\\-]{1,64}$")
    @Column(name = "service_code", nullable = false, updatable = false, length = 64)
    private String serviceCode;

    @NotBlank
    @Size(max = 500)
    @Column(name = "reason", nullable = false, updatable = false, length = 500)
    private String reason;

    @NotBlank
    @Column(name = "approved_by", nullable = false, updatable = false, length = 128)
    private String approvedBy;

    @NotNull
    @Column(name = "approved_at", nullable = false, updatable = false)
    private Instant approvedAt = Instant.now();

    protected ProBonoRecord() {}

    public ProBonoRecord(String tenantId, String patientId, String serviceCode,
                         String reason, String approvedBy) {
        this.tenantId = tenantId;
        this.patientId = patientId;
        this.serviceCode = serviceCode;
        this.reason = reason;
        this.approvedBy = approvedBy;
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getPatientId() { return patientId; }
    public String getServiceCode() { return serviceCode; }
    public String getReason() { return reason; }
    public String getApprovedBy() { return approvedBy; }
    public Instant getApprovedAt() { return approvedAt; }
}