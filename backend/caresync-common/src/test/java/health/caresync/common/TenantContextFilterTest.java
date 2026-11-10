package health.caresync.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.security.TenantContext;
import health.caresync.common.security.TenantContextFilter;
import jakarta.servlet.FilterChain;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class TenantContextFilterTest {
    @Test
    void usesAuthenticatedTenantAndClearsThreadContextAfterRequest() throws Exception {
        UUID authenticatedTenant = UUID.randomUUID();
        CaresyncPrincipal principal = new CaresyncPrincipal(
            "user-1", authenticatedTenant, "PROVIDER", "DENTAL", null
        );
        var authentication = new UsernamePasswordAuthenticationToken(
            principal, null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Tenant-Id", UUID.randomUUID().toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> assertEquals(authenticatedTenant, TenantContext.get());

        try {
            new TenantContextFilter().doFilter(request, response, chain);
            assertNull(TenantContext.get());
        } finally {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
        }
    }

    @Test
    void ignoresTenantHeaderWhenNoAuthenticatedPrincipalExists() throws Exception {
        SecurityContextHolder.clearContext();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Tenant-Id", UUID.randomUUID().toString());
        FilterChain chain = (req, res) -> assertNull(TenantContext.get());

        new TenantContextFilter().doFilter(
            request, new MockHttpServletResponse(), chain
        );

        assertNull(TenantContext.get());
    }

    @Test
    void allowsSuperAdminToSelectATenantForTenantScopedRequests() throws Exception {
        UUID selectedTenant = UUID.randomUUID();
        CaresyncPrincipal principal = new CaresyncPrincipal(
            "platform-admin", null, "SUPER_ADMIN", null, null
        );
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, List.of())
        );
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/patients");
        request.addHeader("X-Tenant-Id", selectedTenant.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> assertEquals(selectedTenant, TenantContext.get());

        try {
            new TenantContextFilter().doFilter(request, response, chain);
            assertEquals(200, response.getStatus());
            assertNull(TenantContext.get());
        } finally {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
        }
    }

    @Test
    void requiresTenantSelectionForSuperAdminTenantDataRequests() throws Exception {
        CaresyncPrincipal principal = new CaresyncPrincipal(
            "platform-admin", null, "SUPER_ADMIN", null, null
        );
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, List.of())
        );
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/patients");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> {
            throw new AssertionError("Tenant-scoped request must not reach the chain");
        };

        try {
            new TenantContextFilter().doFilter(request, response, chain);
            assertEquals(400, response.getStatus());
            assertNull(TenantContext.get());
        } finally {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
        }
    }
}