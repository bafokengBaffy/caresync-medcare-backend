package health.caresync.common.tenant;

import health.caresync.common.security.TenantContext;
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
        jdbcTemplate.queryForObject(
            "select set_config('app.tenant_id', ?, true)",
            String.class,
            tenantId.toString()
        );
        return tenantId;
    }
}
