package health.caresync.patient.audit;
import health.caresync.common.audit.*;
import health.caresync.patient.domain.repository.AuditLogRepository;
import org.springframework.stereotype.Component;
@Component public class JpaAuditClient implements AuditClient {
    private final AuditLogRepository repo;
    public JpaAuditClient(AuditLogRepository r) { this.repo = r; }
    @Override public void write(AuditEvent e) { /* map + save */ }
}