package health.caresync.common.security;

import health.caresync.common.constants.SecurityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Requires mfa_verified claim for privileged paths (OWASP A07). */
@Component
public class MfaEnforcementFilter extends OncePerRequestFilter {

    private static final List<String> PROTECTED_PREFIXES = List.of(
            "/api/v1/admin", "/api/v1/super-admin", "/api/v1/tenant"
    );

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;
    private final boolean fallbackPolicy;
    private volatile boolean cachedPolicy;
    private volatile long policyLoadedAt;

    public MfaEnforcementFilter(
        ObjectProvider<JdbcTemplate> jdbcTemplateProvider,
        @Value("${caresync.security.mfa-enforced:false}") boolean fallbackPolicy
    ) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
        this.fallbackPolicy = fallbackPolicy;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI();
        boolean protectedPath = PROTECTED_PREFIXES.stream().anyMatch(path::startsWith);
        boolean enforced;
        try {
            enforced = protectedPath && isEnforced();
        } catch (MfaPolicyUnavailableException unavailable) {
            res.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"mfa_policy_unavailable\"}");
            return;
        }
        if (enforced) {
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

    private boolean isEnforced() {
        JdbcTemplate jdbc = jdbcTemplateProvider.getIfAvailable();
        if (jdbc == null) return fallbackPolicy;
        long now = System.currentTimeMillis();
        if (now - policyLoadedAt < 30_000) return cachedPolicy;
        synchronized (this) {
            if (now - policyLoadedAt < 30_000) return cachedPolicy;
            try {
                Boolean configured = jdbc.queryForObject("""
                    SELECT COALESCE((configuration_value::jsonb ->> 'enforceMfa')::boolean, false)
                    FROM admin_configurations
                    WHERE scope = 'PLATFORM' AND tenant_id IS NULL AND configuration_key = 'global'
                    """, Boolean.class);
                cachedPolicy = Boolean.TRUE.equals(configured);
                policyLoadedAt = now;
                return cachedPolicy;
            } catch (org.springframework.dao.EmptyResultDataAccessException absent) {
                cachedPolicy = fallbackPolicy;
                policyLoadedAt = now;
                return cachedPolicy;
            } catch (DataAccessException unavailable) {
                throw new MfaPolicyUnavailableException(unavailable);
            }
        }
    }

    private static final class MfaPolicyUnavailableException extends RuntimeException {
        private MfaPolicyUnavailableException(Throwable cause) { super(cause); }
    }
}
