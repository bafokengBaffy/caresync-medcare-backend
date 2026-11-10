package health.caresync.common.tenant;

import health.caresync.common.security.TenantContext;
import health.caresync.common.security.CaresyncPrincipal;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class TenantRlsContext {
    private final JdbcTemplate jdbcTemplate;

    public TenantRlsContext(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    public UUID apply() {
        UUID tenantId = TenantContext.require();
        var authentication = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();
        CaresyncPrincipal principal = authentication != null
            && authentication.getPrincipal() instanceof CaresyncPrincipal current
            ? current
            : null;
        if (principal != null && !"SUPER_ADMIN".equals(principal.role())
            && !tenantId.equals(principal.tenantId())) {
            throw new IllegalStateException("Tenant context is not available");
        }
        configure(principal, tenantId);
        return tenantId;
    }

    public UUID apply(CaresyncPrincipal principal) {
        if (principal == null) {
            throw new IllegalStateException("Authenticated CareSync principal is required");
        }
        return apply(principal, principal.tenantId());
    }

    public void applyIdentity(CaresyncPrincipal principal) {
        if (principal == null || principal.userId() == null || principal.userId().isBlank()) {
            throw new IllegalStateException("Authenticated CareSync principal is required");
        }
        configure(principal, null);
    }

    public UUID apply(CaresyncPrincipal principal, UUID targetTenantId) {
        boolean platformAdmin = principal != null && "SUPER_ADMIN".equals(principal.role());
        if (!platformAdmin && (principal == null || principal.tenantId() == null
            || !principal.tenantId().equals(targetTenantId))) {
            throw new IllegalStateException("Tenant context is not available");
        }
        if (targetTenantId == null && !platformAdmin) {
            throw new IllegalStateException("Tenant context is not available");
        }

        configure(principal, targetTenantId);
        return targetTenantId;
    }

    public UUID applyPublicTenant(UUID tenantId) {
        if (tenantId == null) {
            throw new IllegalStateException("Resolved tenant is required");
        }
        configure(null, tenantId);
        return tenantId;
    }

    private void configure(CaresyncPrincipal principal, UUID targetTenantId) {
        boolean platformAdmin = principal != null && "SUPER_ADMIN".equals(principal.role());
        jdbcTemplate.queryForObject(
            "select set_config('app.tenant_id', ?, true)",
            String.class,
            targetTenantId == null ? "" : targetTenantId.toString()
        );
        jdbcTemplate.queryForObject(
            "select set_config('app.is_super_admin', ?, true)",
            String.class,
            Boolean.toString(platformAdmin)
        );
        jdbcTemplate.queryForObject(
            "select set_config('app.firebase_uid', ?, true)",
            String.class,
            principal == null ? "" : principal.userId()
        );
    }
}
