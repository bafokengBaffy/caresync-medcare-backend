package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.domain.entity.AuditLog;
import health.caresync.patient.domain.repository.AuditLogRepository;
import health.caresync.patient.dto.AuditLogResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantAuditService {
    private final AuditLogRepository auditLogs;
    private final TenantRlsContext tenantRlsContext;

    public TenantAuditService(AuditLogRepository auditLogs, TenantRlsContext tenantRlsContext) {
        this.auditLogs = auditLogs;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> list(CaresyncPrincipal actor, int page, int size) {
        if (actor == null || !"TENANT_ADMIN".equals(actor.role()) || actor.tenantId() == null) {
            throw new ForbiddenException("Tenant administrator role and tenant claim required");
        }
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
        UUID tenantId = actor.tenantId();
        tenantRlsContext.apply(actor, tenantId);
        Page<AuditLog> result = auditLogs.findAllByTenantId(
            tenantId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return new PageResponse<>(
            result.getContent().stream().map(TenantAuditService::toResponse).toList(),
            result.getNumber(), result.getSize(), result.getTotalElements()
        );
    }

    private static AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
            log.getId().toString(), log.getTenantId(), log.getActorUserId(), log.getActorRole(),
            log.getAction(), log.getResourceType(), log.getResourceId(), log.getRequestId(), log.getCreatedAt()
        );
    }
}
