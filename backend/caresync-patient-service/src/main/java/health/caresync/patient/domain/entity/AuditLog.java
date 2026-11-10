package health.caresync.patient.domain.entity;

import health.caresync.common.annotation.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a persistent Audit Log for the Patient Service.
 * OWASP Alignment: Provides an immutable, queryable trail of critical actions
 * (e.g., who viewed which patient, who changed a consent).
 */
@Entity
@Table(name = "audit_logs")
@EntityListeners(TenantAwareEntityListener.class)
@TenantAware
public class AuditLog implements health.caresync.common.tenant.TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "actor_user_id", length = 128)
    private String actorUserId;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType;

    @Column(name = "resource_id", nullable = false, length = 128)
    private String resourceId;

    @Column(columnDefinition = "jsonb")
    private String delta;

    @Column(name = "ip_address", columnDefinition = "inet")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "request_id", length = 128)
    private String requestId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // TenantAware Implementation
    @Override
    public UUID getTenantId() { return tenantId; }
    @Override
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    // Getters and Setters
    public Long getId() { return id; }
    public String getActorUserId() { return actorUserId; }
    public void setActorUserId(String actorUserId) { this.actorUserId = actorUserId; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getDelta() { return delta; }
    public void setDelta(String delta) { this.delta = delta; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
