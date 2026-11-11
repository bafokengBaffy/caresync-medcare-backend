package health.caresync.common.middleware;

import health.caresync.common.constants.HeaderConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

/** Propagates correlation ID across logs (OWASP A09). */
@Component
public class CorrelationIdInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String cid = request.getHeader(HeaderConstants.CORRELATION_ID);
        if (cid == null || cid.isBlank()) cid = UUID.randomUUID().toString();
        MDC.put("correlationId", cid);
        response.setHeader(HeaderConstants.CORRELATION_ID, cid);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        MDC.remove("correlationId");
    }
}