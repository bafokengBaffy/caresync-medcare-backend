package health.caresync.patient.domain.entity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "tenant_id", nullable = false) private UUID tenantId;
    @Column(name = "actor_user_id") private String actorUserId;
    @Column(name = "actor_role") private String actorRole;
    @Column(nullable = false) private String action;
    @Column(name = "resource_type", nullable = false) private String resourceType;
    @Column(name = "resource_id",  nullable = false) private String resourceId;
    @Column(name = "delta", columnDefinition = "text")
    private String delta;
    @Column(name = "ip_address", length = 255) private String ipAddress;
    @Column(name = "user_agent") private String userAgent;
    @Column(name = "request_id") private String requestId;
    @Column(name = "created_at") private Instant createdAt;

    public Long getId() { return id; }
    public UUID getTenantId() { return tenantId; }
    public String getActorUserId() { return actorUserId; }
    public String getActorRole() { return actorRole; }
    public String getAction() { return action; }
    public String getResourceType() { return resourceType; }
    public String getResourceId() { return resourceId; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public String getRequestId() { return requestId; }
    public Instant getCreatedAt() { return createdAt; }

    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public void setActorUserId(String actorUserId) { this.actorUserId = actorUserId; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public void setAction(String action) { this.action = action; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}