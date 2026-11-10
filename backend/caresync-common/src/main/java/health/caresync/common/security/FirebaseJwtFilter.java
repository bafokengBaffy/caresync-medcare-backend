package health.caresync.common.security;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class FirebaseJwtFilter extends OncePerRequestFilter {
    private static final Set<String> ALLOWED_ROLES = Set.of(
        "ADMIN", "PROVIDER", "STAFF", "RECEPTION", "FINANCE", "MANAGER",
        "CONSENT_MANAGER", "CLINICIAN", "PRIVACY_OFFICER", "RECEPTIONIST",
        "SUPER_ADMIN", "TENANT_ADMIN", "PATIENT"
    );
    private static final Pattern PERMISSION_FORMAT = Pattern.compile("[A-Z][A-Z0-9_]{1,63}");
    private static final int MAX_PERMISSIONS = 100;

    private final FirebaseTokenVerifier tokenVerifier;

    public FirebaseJwtFilter(FirebaseTokenVerifier tokenVerifier) {
        this.tokenVerifier = tokenVerifier;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null) {
            chain.doFilter(request, response);
            return;
        }
        if (!authorization.startsWith("Bearer ") || authorization.length() == 7) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token");
            return;
        }

        try {
            FirebaseToken token = tokenVerifier.verify(authorization.substring(7));
            String tenantClaim = token.getClaims().get(JwtClaims.TENANT_ID) instanceof String value
                ? value
                : null;
            String role = token.getClaims().get(JwtClaims.ROLE) instanceof String value
                ? value
                : null;
            boolean provisioningRequest = request.getRequestURI().equals("/api/v1/auth/sync")
                || request.getRequestURI().equals("/api/v1/auth/pending-status");
            if (role == null || !ALLOWED_ROLES.contains(role)) {
                if (!provisioningRequest || tenantClaim != null || role != null) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token");
                    return;
                }
                CaresyncPrincipal principal = new CaresyncPrincipal(
                    token.getUid(), null, null, "", token.getEmail()
                );
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null, List.of())
                );
                chain.doFilter(request, response);
                return;
            }

            boolean platformAdmin = "SUPER_ADMIN".equals(role);
            if ((platformAdmin && tenantClaim != null) || (!platformAdmin && tenantClaim == null)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token");
                return;
            }

            UUID tenantId = tenantClaim == null ? null : UUID.fromString(tenantClaim);
            String specialty = token.getClaims().get(JwtClaims.SPECIALTY) instanceof String value
                ? value
                : "";
            Set<String> permissions = parsePermissions(token.getClaims().get(JwtClaims.PERMISSIONS));
            CaresyncPrincipal principal = new CaresyncPrincipal(
                token.getUid(), tenantId, role, specialty, token.getEmail()
            );
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
            permissions.stream().map(SimpleGrantedAuthority::new).forEach(authorities::add);
            SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, authorities)
            );
        } catch (FirebaseAuthException | IllegalArgumentException | IllegalStateException exception) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token");
            return;
        }

        chain.doFilter(request, response);
    }

    private Set<String> parsePermissions(Object claim) {
        if (claim == null) {
            return Set.of();
        }
        if (!(claim instanceof Collection<?> values) || values.size() > MAX_PERMISSIONS) {
            throw new IllegalArgumentException("Invalid permissions claim");
        }
        Set<String> permissions = new HashSet<>();
        for (Object value : values) {
            if (!(value instanceof String permission)
                || !PERMISSION_FORMAT.matcher(permission).matches()) {
                throw new IllegalArgumentException("Invalid permissions claim");
            }
            permissions.add(permission);
        }
        return Set.copyOf(permissions);
    }
}
