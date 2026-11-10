package health.caresync.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class TenantContextFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof CaresyncPrincipal principal) {
                TenantContext.setUserId(principal.userId());
                TenantContext.setRole(principal.role());

                if (principal.tenantId() != null) {
                    TenantContext.set(principal.tenantId());
                } else if ("SUPER_ADMIN".equals(principal.role())) {
                    String selectedTenant = request.getHeader("X-Tenant-Id");
                    if (selectedTenant != null && !selectedTenant.isBlank()) {
                        try {
                            TenantContext.set(UUID.fromString(selectedTenant));
                        } catch (IllegalArgumentException exception) {
                            response.sendError(
                                HttpServletResponse.SC_BAD_REQUEST,
                                "Selected tenant ID must be a UUID"
                            );
                            return;
                        }
                    } else if (requiresTenantContext(request.getRequestURI())) {
                        response.sendError(
                            HttpServletResponse.SC_BAD_REQUEST,
                            "Select a tenant before accessing tenant data"
                        );
                        return;
                    }
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean requiresTenantContext(String path) {
        return path.startsWith("/api/v1/")
            && !path.startsWith("/api/v1/admin/")
            && !path.startsWith("/api/v1/auth/")
            && !path.startsWith("/api/v1/profile/")
            && !path.startsWith("/api/v1/public/");
    }
}
