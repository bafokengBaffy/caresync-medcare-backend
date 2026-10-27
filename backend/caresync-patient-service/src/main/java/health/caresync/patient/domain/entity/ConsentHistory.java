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
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patient_consent_history")
@EntityListeners(TenantAwareEntityListener.class)
public class ConsentHistory implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "consent_id", nullable = false, updatable = false)
    private UUID consentId;

    @Column(nullable = false, length = 24, updatable = false)
    private String action;

    @Column(name = "previous_status", length = 16, updatable = false)
    private String previousStatus;

    @Column(name = "new_status", length = 16, updatable = false)
    private String newStatus;

    @Column(length = 1000, updatable = false)
    private String reason;

    @Column(name = "actor_user_id", nullable = false, length = 128, updatable = false)
    private String actorUserId;

    @Column(name = "correlation_id", length = 128, updatable = false)
    private String correlationId;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected ConsentHistory() {
    }

    public ConsentHistory(
        UUID tenantId,
        UUID consentId,
        String action,
        String previousStatus,
        String newStatus,
        String reason,
        String actorUserId,
        String correlationId,
        Instant occurredAt
    ) {
        this.tenantId = tenantId;
        this.consentId = consentId;
        this.action = action;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.reason = reason;
        this.actorUserId = actorUserId;
        this.correlationId = correlationId;
        this.occurredAt = occurredAt;
    }

    @PrePersist
    void onCreate() {
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
    }

    @Override
    public UUID getTenantId() {
        return tenantId;
    }

    @Override
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getConsentId() {
        return consentId;
    }

    public String getAction() {
        return action;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public String getReason() {
        return reason;
    }

    public String getActorUserId() {
        return actorUserId;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
