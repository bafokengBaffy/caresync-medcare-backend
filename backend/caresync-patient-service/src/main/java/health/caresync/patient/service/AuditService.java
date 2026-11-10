package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.AuditLog;
import health.caresync.patient.domain.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private final AuditLogRepository repository;
    private final TenantRlsContext tenantRlsContext;

    public AuditService(AuditLogRepository repository, TenantRlsContext tenantRlsContext) {
        this.repository = repository;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public AuditLog record(
        UUID tenantId,
        String actorUserId,
        String actorRole,
        String action,
        String resourceType,
        String resourceId,
        String correlationId
    ) {
        Objects.requireNonNull(tenantId, "tenantId");
        if (!tenantId.equals(tenantRlsContext.apply())) {
            throw new ForbiddenException("Tenant access denied");
        }
        requireText(action, "action");
        requireText(resourceType, "resourceType");
        requireText(resourceId, "resourceId");

        AuditLog log = new AuditLog();
        log.setTenantId(tenantId);
        log.setActorUserId(actorUserId);
        log.setActorRole(actorRole);
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setRequestId(correlationId);
        log.setCreatedAt(Instant.now());
        return repository.save(log);
    }

    @Transactional
    public AuditLog recordAdministrativeAction(
        CaresyncPrincipal actor,
        UUID tenantId,
        String action,
        String resourceType,
        String resourceId,
        HttpServletRequest request
    ) {
        if (actor == null || actor.userId() == null || actor.userId().isBlank()) {
            throw new ForbiddenException("Authenticated actor required");
        }
        tenantRlsContext.apply(actor, tenantId);
        requireText(action, "action");
        requireText(resourceType, "resourceType");
        requireText(resourceId, "resourceId");

        AuditLog log = new AuditLog();
        log.setTenantId(tenantId);
        log.setActorUserId(actor.userId());
        log.setActorRole(actor.role());
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setCreatedAt(Instant.now());
        log.setIpAddress(request == null ? null : request.getRemoteAddr());
        if (request != null) {
            String userAgent = request.getHeader("User-Agent");
            log.setUserAgent(userAgent == null ? null : userAgent.substring(0, Math.min(1024, userAgent.length())));
            String requestId = request.getHeader("X-Correlation-Id");
            if (requestId == null || !requestId.matches("[A-Za-z0-9._-]{1,128}")) {
                requestId = null;
            }
            log.setRequestId(requestId);
        }
        return repository.save(log);
    }

    private static void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
    }
}