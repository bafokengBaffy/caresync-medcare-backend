package health.caresync.common.security;

import health.caresync.common.constants.SecurityConstants;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Extracts tenant from JWT claims (client cannot spoof). */
@Component
public class TenantJwtClaimsExtractor {

    public String extractTenant(Map<String, Object> claims) {
        if (claims == null) return null;
        Object v = claims.get(SecurityConstants.CLAIM_TENANT_ID);
        return v == null ? null : v.toString();
    }
}