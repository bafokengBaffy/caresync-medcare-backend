package health.caresync.laboratory.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.security.CaresyncPrincipal;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class LabReferenceValidator {
    private final JdbcTemplate jdbcTemplate;

    public LabReferenceValidator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void requirePatient(UUID tenantId, UUID patientId) {
        Boolean found = jdbcTemplate.queryForObject(
            "select exists(select 1 from public.patients where tenant_id = ? and id = ?)",
            Boolean.class,
            tenantId,
            patientId
        );
        if (!Boolean.TRUE.equals(found)) throw new NotFoundException("Patient not found");
    }

    public void requireActiveProvider(UUID tenantId, UUID providerId) {
        Boolean active = jdbcTemplate.query(
            "select is_active from public.providers where tenant_id = ? and id = ?",
            resultSet -> resultSet.next() && resultSet.getBoolean(1),
            tenantId,
            providerId
        );
        if (!Boolean.TRUE.equals(active)) throw new NotFoundException("Active provider not found");
    }

    public UUID providerIdForCurrentProvider(UUID tenantId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
            || !(authentication.getPrincipal() instanceof CaresyncPrincipal principal)
            || !"PROVIDER".equals(principal.role())) {
            return null;
        }
        UUID providerId = jdbcTemplate.query(
            "select id from public.providers where tenant_id = ? and user_id = ? and is_active",
            resultSet -> resultSet.next() ? UUID.fromString(resultSet.getString(1)) : null,
            tenantId,
            principal.userId()
        );
        if (providerId == null) throw new ForbiddenException("Active provider profile required");
        return providerId;
    }
}
