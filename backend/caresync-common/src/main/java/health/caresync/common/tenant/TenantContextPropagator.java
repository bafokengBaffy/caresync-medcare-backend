package health.caresync.common.tenant;

import health.caresync.common.security.TenantContext;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.concurrent.Callable;

/** Propagates tenant context to async threads (OWASP A01). */
@Component
public class TenantContextPropagator {

    public <T> Callable<T> wrap(Callable<T> task) {
        String tenant = TenantContext.getTenantId();
        return () -> {
            String previous = TenantContext.getTenantId();
            try {
                TenantContext.setTenantId(tenant);
                if (tenant != null) MDC.put("tenantId", tenant);
                return task.call();
            } finally {
                if (previous == null) TenantContext.clear();
                else TenantContext.setTenantId(previous);
                MDC.remove("tenantId");
            }
        };
    }
}