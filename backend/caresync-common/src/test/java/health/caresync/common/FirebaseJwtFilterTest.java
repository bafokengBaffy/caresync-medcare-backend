package health.caresync.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.firebase.auth.FirebaseToken;
import health.caresync.common.security.FirebaseJwtFilter;
import health.caresync.common.security.FirebaseTokenVerifier;
import jakarta.servlet.FilterChain;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.security.core.context.SecurityContextHolder;

class FirebaseJwtFilterTest {
    private final FirebaseTokenVerifier verifier = org.mockito.Mockito.mock(FirebaseTokenVerifier.class);
    private final FirebaseJwtFilter filter = new FirebaseJwtFilter(verifier);

    @Test
    void rejectsMalformedBearerHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic abc");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(401, response.getStatus());
    }

    @Test
    void rejectsVerifiedTokenWithoutTenantClaim() throws Exception {
        FirebaseToken token = org.mockito.Mockito.mock(FirebaseToken.class);
        when(verifier.verify("token")).thenReturn(token);
        when(token.getClaims()).thenReturn(Map.of("role", "PROVIDER"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void invalidTokenDoesNotContinueAnonymously() throws Exception {
        when(verifier.verify("invalid")).thenThrow(new IllegalArgumentException("invalid"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = org.mockito.Mockito.mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(401, response.getStatus());
        verify(chain, org.mockito.Mockito.never()).doFilter(request, response);
    }

    @Test
    void mapsPermissionClaimsToAuthoritiesAndAllowsClinicalRole() throws Exception {
        FirebaseToken token = org.mockito.Mockito.mock(FirebaseToken.class);
        when(verifier.verify("token")).thenReturn(token);
        when(token.getClaims()).thenReturn(Map.of(
            "tenant_id", UUID.randomUUID().toString(),
            "role", "CLINICIAN",
            "permissions", List.of("CONSENT_READ", "CONSENT_WRITE")
        ));
        when(token.getUid()).thenReturn("user-1");
        when(token.getEmail()).thenReturn("user@example.test");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + "token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();

        filter.doFilter(request, response, new MockFilterChain());

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertEquals(200, response.getStatus());
        assertTrue(authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_CLINICIAN")));
        assertTrue(authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("CONSENT_WRITE")));
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsMalformedPermissionClaims() throws Exception {
        FirebaseToken token = org.mockito.Mockito.mock(FirebaseToken.class);
        when(verifier.verify("token")).thenReturn(token);
        when(token.getClaims()).thenReturn(Map.of(
            "tenant_id", UUID.randomUUID().toString(),
            "role", "ADMIN",
            "permissions", List.of("CONSENT WRITE")
        ));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + "token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext();
    }
}