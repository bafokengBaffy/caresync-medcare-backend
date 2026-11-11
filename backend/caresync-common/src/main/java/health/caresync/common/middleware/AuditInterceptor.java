package health.caresync.common.middleware;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Logs mutating request metadata (method + path only — never body). */
@Component
public class AuditInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger("AUDIT");

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String method = req.getMethod();
        if (!"GET".equals(method) && !"HEAD".equals(method) && !"OPTIONS".equals(method)) {
            log.info("method={} path={} remote={}", method,
                    sanitize(req.getRequestURI()), req.getRemoteAddr());
        }
        return true;
    }

    private String sanitize(String s) {
        return s == null ? "" : s.replaceAll("[\\r\\n]", "_");
    }
}