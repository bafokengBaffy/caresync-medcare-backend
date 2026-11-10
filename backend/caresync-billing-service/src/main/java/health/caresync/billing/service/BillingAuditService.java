package health.caresync.billing.service;

import health.caresync.billing.domain.entity.BillingAuditLog;
import health.caresync.billing.domain.enums.BillingAuditAction;
import health.caresync.billing.domain.repository.BillingAuditLogRepository;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class BillingAuditService {
    private final BillingAuditLogRepository auditLogs;

    public BillingAuditService(BillingAuditLogRepository auditLogs) {
        this.auditLogs = auditLogs;
    }

    public void record(
        UUID tenantId,
        BillingAuditAction action,
        String resourceType,
        UUID resourceId,
        String details
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        BillingAuditLog entry = new BillingAuditLog();
        entry.setTenantId(tenantId);
        entry.setAction(action);
        entry.setResourceType(resourceType);
        entry.setResourceId(resourceId);
        entry.setActorName(authentication == null ? null : authentication.getName());
        entry.setDetails(details);
        auditLogs.save(entry);
    }
}