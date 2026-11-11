package health.caresync.common.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Structured security audit logger (no PII, no secrets). */
@Component
public class SecurityAuditLogger {

    private static final Logger log = LoggerFactory.getLogger("SECURITY_AUDIT");

    public void denied(String tenantId, String principal, String resource, String reason) {
        log.warn("denied tenant={} principal={} resource={} reason={}",
                safe(tenantId), safe(principal), safe(resource), safe(reason));
    }

    public void granted(String tenantId, String principal, String resource) {
        log.info("granted tenant={} principal={} resource={}",
                safe(tenantId), safe(principal), safe(resource));
    }

    private String safe(String s) {
        return s == null ? "" : s.replaceAll("[\\r\\n]", "_");
    }
}