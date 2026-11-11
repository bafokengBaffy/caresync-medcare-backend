package health.caresync.common.middleware;

import health.caresync.common.constants.HeaderConstants;
import health.caresync.common.security.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Sets tenant context from header for non-JWT paths; cleared at completion. */
@Component
public class TenantInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object h) {
        String tenantId = req.getHeader(HeaderConstants.TENANT_ID);
        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setTenantId(tenantId);
            MDC.put("tenantId", tenantId);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                Object h, Exception ex) {
        TenantContext.clear();
        MDC.remove("tenantId");
    }
}