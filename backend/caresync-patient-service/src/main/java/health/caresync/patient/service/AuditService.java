package health.caresync.patient.service;
import health.caresync.patient.domain.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
@Service public class AuditService { private final AuditLogRepository repo; public AuditService(AuditLogRepository r){this.repo=r;} }