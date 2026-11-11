package health.caresync.patient.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_configurations")
public class AdminConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 16)
    private String scope;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "configuration_key", nullable = false, length = 100)
    private String configurationKey;

    @Column(name = "configuration_value", nullable = false)
    private String configurationValue;

    @Column(name = "updated_by", length = 128)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getId() { return id; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public String getConfigurationKey() { return configurationKey; }
    public void setConfigurationKey(String configurationKey) { this.configurationKey = configurationKey; }
    public String getConfigurationValue() { return configurationValue; }
    public void setConfigurationValue(String configurationValue) { this.configurationValue = configurationValue; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
