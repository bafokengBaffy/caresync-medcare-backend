package health.caresync.common.security;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.FirebaseAuthException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Set;
import java.util.List;
import java.util.UUID;

public class FirebaseJwtFilter extends OncePerRequestFilter {
    private static final Set<String> ALLOWED_ROLES =
        Set.of("ADMIN", "PROVIDER", "STAFF", "RECEPTION", "FINANCE", "MANAGER");

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
            if (tenantClaim == null || role == null || !ALLOWED_ROLES.contains(role)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token");
                return;
            }

            UUID tenantId = UUID.fromString(tenantClaim);
            String specialty = token.getClaims().get(JwtClaims.SPECIALTY) instanceof String value
                ? value
                : "";
            CaresyncPrincipal principal = new CaresyncPrincipal(
                token.getUid(), tenantId, role, specialty, token.getEmail()
            );
            var authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (FirebaseAuthException | IllegalArgumentException | IllegalStateException e) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token");
            return;
        }

        chain.doFilter(request, response);
    }
}