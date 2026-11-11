package health.caresync.common.middleware;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Deprecated — use @RateLimit aspect for finer control. Kept for backward compat. */
@Component
@Deprecated
public class RateLimitInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object h) {
        return true;
    }
}