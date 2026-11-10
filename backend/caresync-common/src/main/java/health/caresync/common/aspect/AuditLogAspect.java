package health.caresync.common.aspect;

import health.caresync.common.annotation.AuditLog;
import health.caresync.common.security.TenantContext;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Aspect to handle automated audit logging for annotated methods.
 * OWASP Alignment: Ensures that security-relevant events (viewing PHI, modifying billing)
 * are recorded with the user ID, tenant ID, and timestamp to meet compliance requirements.
 */
@Aspect
@Component
public class AuditLogAspect {

    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT");

    @AfterReturning(pointcut = "@annotation(auditLog)", returning = "result")
    public void logAuditEvent(JoinPoint joinPoint, AuditLog auditLog, Object result) {
        String userId = TenantContext.getUserId() != null ? TenantContext.getUserId() : "SYSTEM";
        String tenantId = TenantContext.getTenantId() != null ? TenantContext.getTenantId() : "GLOBAL";
        String methodName = joinPoint.getSignature().toShortString();
        
        // In a real production system, this would be pushed to an async queue (RabbitMQ) 
        // or written directly to an immutable audit database.
        auditLogger.info("AUDIT_EVENT | Timestamp: {} | Tenant: {} | User: {} | Action: {} | Method: {} | Status: SUCCESS",
                Instant.now().toString(),
                tenantId,
                userId,
                auditLog.action(),
                methodName);
    }
}
