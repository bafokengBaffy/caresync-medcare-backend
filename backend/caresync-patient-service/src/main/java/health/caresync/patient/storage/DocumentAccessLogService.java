package health.caresync.patient.storage;

import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentAccessLogService {
    private static final Set<String> ACTIONS = Set.of("LIST", "UPLOAD", "DOWNLOAD", "DELETE", "RESTORE");

    private final DocumentAccessLogRepository repository;
    private final TenantRlsContext tenantRlsContext;

    public DocumentAccessLogService(
        DocumentAccessLogRepository repository,
        TenantRlsContext tenantRlsContext
    ) {
        this.repository = repository;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public DocumentAccessLog record(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        String actorUserId,
        String action,
        String correlationId
    ) {
        if (tenantId == null || !tenantId.equals(tenantRlsContext.apply())) {
            throw new health.caresync.common.exception.ForbiddenException("Tenant access denied");
        }
        if (patientId == null || (documentId == null && !"LIST".equals(action))
            || actorUserId == null || actorUserId.isBlank()
            || actorUserId.length() > 128 || action == null || !ACTIONS.contains(action)) {
            throw new ValidationException("Document access audit data is invalid");
        }
        if (correlationId != null && !correlationId.matches("[A-Za-z0-9._-]{1,128}")) {
            throw new ValidationException("Correlation ID is invalid");
        }
        return repository.save(new DocumentAccessLog(
            tenantId, patientId, documentId, actorUserId, action, correlationId
        ));
    }
}