package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.ApiResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenant")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class TenantAdminController {
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;

    public TenantAdminController(JdbcTemplate jdbcTemplate, TenantRlsContext tenantRlsContext) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<TenantDashboardResponse>> dashboard(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        UUID tenantId = requireTenant(actor);
        tenantRlsContext.apply(actor, tenantId);
        TenantDashboardStats stats = new TenantDashboardStats(
            count("SELECT COUNT(*) FROM firebase_users WHERE tenant_id = ? AND deleted_at IS NULL", tenantId),
            count("SELECT COUNT(*) FROM firebase_users WHERE tenant_id = ? AND deleted_at IS NULL AND disabled = FALSE", tenantId),
            count("SELECT COUNT(*) FROM patients WHERE tenant_id = ?", tenantId),
            count("SELECT COUNT(*) FROM appointments WHERE tenant_id = ? AND scheduled_start::date = CURRENT_DATE", tenantId),
            count("SELECT COUNT(*) FROM appointments WHERE tenant_id = ? AND date_trunc('month', scheduled_start) = date_trunc('month', CURRENT_DATE)", tenantId),
            sum("SELECT COALESCE(SUM(amount_cents), 0) FROM invoices WHERE tenant_id = ? AND status IN ('ISSUED', 'PARTIALLY_PAID')", tenantId),
            sum("SELECT COALESCE(SUM(amount_cents), 0) FROM invoices WHERE tenant_id = ? AND status = 'PAID'", tenantId),
            count("SELECT COUNT(*) FROM registration_requests WHERE requested_tenant_id = ? AND status = 'PENDING'", tenantId)
        );
        List<RecentActivity> recentActivity = jdbcTemplate.query(
            """
                SELECT a.id::text, a.action, COALESCE(u.email, a.actor_user_id, 'System'),
                       a.resource_type, a.created_at
                FROM audit_logs a
                LEFT JOIN firebase_users u ON u.firebase_uid = a.actor_user_id
                WHERE a.tenant_id = ?
                ORDER BY a.created_at DESC
                LIMIT 5
                """,
            (resultSet, rowNumber) -> new RecentActivity(
                resultSet.getString(1),
                resultSet.getString(2),
                resultSet.getString(3),
                resultSet.getString(4),
                resultSet.getTimestamp(5).toInstant()
            ),
            tenantId
        );
        return ResponseEntity.ok(ApiResponse.ok(new TenantDashboardResponse(stats, recentActivity)));
    }

    private long count(String sql, UUID tenantId) {
        Long result = jdbcTemplate.queryForObject(sql, Long.class, tenantId);
        return result == null ? 0 : result;
    }

    private long sum(String sql, UUID tenantId) {
        Long result = jdbcTemplate.queryForObject(sql, Long.class, tenantId);
        return result == null ? 0 : result;
    }

    private static UUID requireTenant(CaresyncPrincipal actor) {
        if (actor == null || actor.tenantId() == null) {
            throw new IllegalStateException("Tenant admin must have a tenant claim");
        }
        return actor.tenantId();
    }

    public record TenantDashboardResponse(TenantDashboardStats stats, List<RecentActivity> recentActivity) { }
    public record TenantDashboardStats(
        long totalUsers,
        long activeUsers,
        long totalPatients,
        long appointmentsToday,
        long appointmentsThisMonth,
        long outstandingInvoicesCents,
        long paidInvoicesCents,
        long pendingRegistrations
    ) { }
    public record RecentActivity(
        String id,
        String action,
        String actorEmail,
        String resourceType,
        Instant createdAt
    ) { }
}
