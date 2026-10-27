package health.caresync.patient.storage;

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
@Table(name = "patient_document_access_logs")
@EntityListeners(TenantAwareEntityListener.class)
public class DocumentAccessLog implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "patient_id", nullable = false, updatable = false)
    private UUID patientId;

    @Column(name = "document_id", updatable = false)
    private UUID documentId;

    @Column(name = "actor_user_id", nullable = false, length = 128, updatable = false)
    private String actorUserId;

    @Column(nullable = false, length = 16, updatable = false)
    private String action;

    @Column(name = "correlation_id", length = 128, updatable = false)
    private String correlationId;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected DocumentAccessLog() { }

    public DocumentAccessLog(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        String actorUserId,
        String action,
        String correlationId
    ) {
        this.tenantId = tenantId;
        this.patientId = patientId;
        this.documentId = documentId;
        this.actorUserId = actorUserId;
        this.action = action;
        this.correlationId = correlationId;
    }

    @PrePersist
    void onCreate() {
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
    }

    @Override
    public UUID getTenantId() { return tenantId; }

    @Override
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public UUID getDocumentId() { return documentId; }
    public String getActorUserId() { return actorUserId; }
    public String getAction() { return action; }
    public String getCorrelationId() { return correlationId; }
    public Instant getOccurredAt() { return occurredAt; }
}