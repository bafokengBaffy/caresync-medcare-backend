package health.caresync.common.tenant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Hook for tenant bootstrap tasks; modules override with real logic. */
@Component
public class TenantDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(TenantDataInitializer.class);

    public void initialize(String tenantId) {
        log.info("tenant initialization requested tenant={}", tenantId);
    }
}