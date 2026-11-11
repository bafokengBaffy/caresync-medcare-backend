package health.caresync.common.middleware;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Baseline security headers (OWASP A05). */
@Component
public class SecurityHeadersInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object h) {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
        res.setHeader("Content-Security-Policy", "default-src 'self'");
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        return true;
    }
}