package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.domain.entity.AuditLog;
import health.caresync.patient.domain.repository.AuditLogRepository;
import health.caresync.patient.dto.AuditLogResponse;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final TenantRlsContext tenantRlsContext;

    public AuditLogService(AuditLogRepository auditLogRepository, TenantRlsContext tenantRlsContext) {
        this.auditLogRepository = auditLogRepository;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> list(UUID tenantId, int page, int size) {
        UUID authenticatedTenantId = tenantRlsContext.apply();
        if (!Objects.equals(tenantId, authenticatedTenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }

        Page<AuditLog> logs = auditLogRepository.findAllByTenantId(
            tenantId,
            PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return new PageResponse<>(
            logs.getContent().stream().map(this::toResponse).toList(),
            logs.getNumber(),
            logs.getSize(),
            logs.getTotalElements()
        );
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
            log.getId().toString(),
            log.getTenantId(),
            log.getActorUserId(),
            log.getActorRole(),
            log.getAction(),
            log.getResourceType(),
            log.getResourceId(),
            log.getDelta(),
            log.getIpAddress(),
            log.getUserAgent(),
            log.getRequestId(),
            log.getCreatedAt()
        );
    }
}
