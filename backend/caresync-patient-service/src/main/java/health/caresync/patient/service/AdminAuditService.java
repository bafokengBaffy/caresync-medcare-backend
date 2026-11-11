package health.caresync.patient.service;

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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuditService {
    private final AuditLogRepository auditLogs;
    private final TenantRlsContext tenantRlsContext;

    public AdminAuditService(AuditLogRepository auditLogs, TenantRlsContext tenantRlsContext) {
        this.auditLogs = auditLogs;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> list(
        CaresyncPrincipal actor,
        UUID tenantId,
        String action,
        String userId,
        String search,
        int page,
        int size
    ) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
        tenantRlsContext.apply(actor, null);
        Specification<AuditLog> criteria = (root, query, builder) -> builder.conjunction();
        if (tenantId != null) {
            criteria = criteria.and((root, query, builder) -> builder.equal(root.get("tenantId"), tenantId));
        }
        if (action != null && !action.isBlank()) {
            String pattern = "%" + action.trim().toLowerCase() + "%";
            criteria = criteria.and((root, query, builder) ->
                builder.like(builder.lower(root.get("action")), pattern));
        }
        if (userId != null && !userId.isBlank()) {
            String pattern = "%" + userId.trim().toLowerCase() + "%";
            criteria = criteria.and((root, query, builder) ->
                builder.like(builder.lower(root.get("actorUserId")), pattern));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            criteria = criteria.and((root, query, builder) -> builder.or(
                builder.like(builder.lower(root.get("action")), pattern),
                builder.like(builder.lower(root.get("resourceType")), pattern),
                builder.like(builder.lower(root.get("actorUserId")), pattern)
            ));
        }
        Page<AuditLog> result = auditLogs.findAll(
            criteria,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return new PageResponse<>(
            result.getContent().stream().map(AdminAuditService::toResponse).toList(),
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
