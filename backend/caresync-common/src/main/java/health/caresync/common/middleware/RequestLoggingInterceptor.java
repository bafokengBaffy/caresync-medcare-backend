package health.caresync.common.middleware;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor to log HTTP requests and responses for auditing and debugging.
 * OWASP Alignment: Logs are sanitized to prevent Log Injection (CRLF) attacks.
 * Sensitive headers (Authorization) are NEVER logged.
 */
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Sanitize URI to prevent CRLF injection in logs
        String sanitizedUri = request.getRequestURI().replaceAll("[\r\n]", "");
        log.info("Incoming Request: [{}] {} | IP: {}", 
                request.getMethod(), 
                sanitizedUri,
                request.getRemoteAddr());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String sanitizedUri = request.getRequestURI().replaceAll("[\r\n]", "");
        if (ex != null) {
            log.error("Request Failed: [{}] {} | Status: {} | Error: {}", 
                    request.getMethod(), sanitizedUri, response.getStatus(), ex.getMessage());
        } else {
            log.info("Request Completed: [{}] {} | Status: {}", 
                    request.getMethod(), sanitizedUri, response.getStatus());
        }
    }
}
