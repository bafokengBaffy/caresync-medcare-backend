package health.caresync.patient.domain.entity;

import health.caresync.common.tenant.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patient_documents")
@EntityListeners(TenantAwareEntityListener.class)
public class PatientDocument implements TenantAware {
    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "media_url", nullable = false, length = 512)
    private String mediaUrl;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    protected PatientDocument() { }

    public PatientDocument(
        UUID id,
        UUID patientId,
        String fileName,
        String contentType,
        long sizeBytes,
        String mediaUrl,
        Instant uploadedAt
    ) {
        this.id = id;
        this.patientId = patientId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.mediaUrl = mediaUrl;
        this.uploadedAt = uploadedAt;
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

    public UUID getPatientId() {
        return patientId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }
}
