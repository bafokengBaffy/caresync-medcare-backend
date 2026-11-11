package health.caresync.common.security;

import health.caresync.common.constants.SecurityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Requires mfa_verified claim for privileged paths (OWASP A07). */
@Component
public class MfaEnforcementFilter extends OncePerRequestFilter {

    private static final List<String> PROTECTED_PREFIXES = List.of(
            "/api/v1/admin", "/api/v1/super-admin"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI();
        boolean protectedPath = PROTECTED_PREFIXES.stream().anyMatch(path::startsWith);
        if (protectedPath) {
            Object mfa = req.getAttribute(SecurityConstants.CLAIM_MFA_VERIFIED);
            if (!Boolean.TRUE.equals(mfa)) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"mfa_required\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}