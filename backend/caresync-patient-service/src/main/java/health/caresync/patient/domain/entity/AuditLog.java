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
    private String delta;   // JSONB column
    @Column(name = "ip_address") private String ipAddress;
    @Column(name = "user_agent") private String userAgent;
    @Column(name = "request_id") private String requestId;
    @Column(name = "created_at") private Instant createdAt;
}