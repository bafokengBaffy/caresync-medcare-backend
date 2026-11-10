package health.caresync.patient.domain.entity;

import health.caresync.common.tenant.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patient_referrals")
@EntityListeners(TenantAwareEntityListener.class)
public class PatientReferral implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "patient_id", nullable = false, updatable = false)
    private UUID patientId;

    @Column(name = "referral_type", nullable = false, length = 16)
    private String referralType;

    @Column(name = "recipient_name", nullable = false, length = 200)
    private String recipientName;

    @Column(name = "recipient_organization", length = 200)
    private String recipientOrganization;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "created_by", nullable = false, updatable = false, length = 128)
    private String createdBy;

    @Column(name = "updated_by", nullable = false, length = 128)
    private String updatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected PatientReferral() { }

    public PatientReferral(
        UUID tenantId,
        UUID patientId,
        String referralType,
        String recipientName,
        String recipientOrganization,
        String reason,
        String notes,
        String actorId
    ) {
        this.tenantId = tenantId;
        this.patientId = patientId;
        this.referralType = referralType;
        this.recipientName = recipientName;
        this.recipientOrganization = recipientOrganization;
        this.reason = reason;
        this.notes = notes;
        this.status = "PENDING";
        this.createdBy = actorId;
        this.updatedBy = actorId;
    }

    @Override
    public UUID getTenantId() {
        return tenantId;
    }

    @Override
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public String getReferralType() { return referralType; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientOrganization() { return recipientOrganization; }
    public String getReason() { return reason; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void updateStatus(String status, String notes, String actorId) {
        this.status = status;
        this.notes = notes;
        this.updatedBy = actorId;
    }

    @PrePersist
    private void initializeTimestamps() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void updateTimestamp() {
        updatedAt = Instant.now();
    }
}
