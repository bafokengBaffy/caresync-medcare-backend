package health.caresync.gateway.service;

import health.caresync.gateway.config.VerifiedIdentity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

/**
 * Tenant routing / isolation enforcement.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A01 – Broken access control: cross-tenant access is denied by default.</li>
 *   <li>A04 – Insecure design: tenant is derived from verified identity, not client input.</li>
 *   <li>A07 – Auth failures: requires verified identity for scoped routes.</li>
 *   <li>A09 – Logging: cross-tenant attempts audited with correlation id.</li>
 * </ul>
 */
@Service
public class TenantRoutingService {

    private static final Logger log = LoggerFactory.getLogger(TenantRoutingService.class);

    /** Roles permitted to route cross-tenant (platform operators). */
    private static final Set<String> CROSS_TENANT_ROLES =
            Set.of("SUPER_ADMIN", "SYSTEM_ADMIN");

    /** Headers that clients must never be able to override for tenant context. */
    public static final String TRUSTED_TENANT_HEADER = "X-Tenant-Id";

    /**
     * Resolve the effective tenant ID for this request.
     *
     * @param identity       verified caller identity
     * @param clientTenantId tenant ID supplied in the request (query/header), may be null
     * @return effective tenant ID
     * @throws TenantAccessDeniedException if the caller cannot act for the requested tenant
     */
    public String resolveTenant(VerifiedIdentity identity, String clientTenantId) {
        if (identity == null || identity.tenantId() == null || identity.tenantId().isBlank()) {
            throw new TenantAccessDeniedException("No tenant bound to identity");
        }

        String ownTenant = identity.tenantId();

        // No client tenant requested → use identity's own tenant.
        if (clientTenantId == null || clientTenantId.isBlank()) {
            return ownTenant;
        }

        // Bounded + validated to prevent header injection (A03).
        String requested = clientTenantId.trim();
        if (requested.length() > 64 || !requested.matches("^[A-Za-z0-9_-]{1,64}$")) {
            throw new TenantAccessDeniedException("Invalid tenant identifier");
        }

        // Same tenant: allowed.
        if (requested.equalsIgnoreCase(ownTenant)) {
            return ownTenant;
        }

        // Cross-tenant: only platform roles allowed.
        if (hasCrossTenantRole(identity)) {
            log.info("tenant_cross_access allowed");
            return requested;
        }

        // Deny + audit (A01/A09).
        log.warn("tenant_cross_access_denied");
        throw new TenantAccessDeniedException("Cross-tenant access denied");
    }

    /**
     * Returns true if the caller may operate cross-tenant.
     */
    public boolean hasCrossTenantRole(VerifiedIdentity identity) {
        if (identity == null || identity.roles() == null) return false;
        for (String r : identity.roles()) {
            if (r != null && CROSS_TENANT_ROLES.contains(r.trim().toUpperCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    /** Thrown when a tenant routing decision is denied. */
    public static class TenantAccessDeniedException extends RuntimeException {
        public TenantAccessDeniedException(String message) {
            super(message);
        }
    }
}