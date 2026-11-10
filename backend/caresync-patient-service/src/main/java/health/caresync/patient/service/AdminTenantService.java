package health.caresync.patient.service;

import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.dto.admin.AdminTenantDtos;
import jakarta.servlet.http.HttpServletRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class AdminTenantService {
    private final JdbcTemplate jdbc;
    private final TenantRlsContext tenantRlsContext;
    private final AuditService auditService;

    public AdminTenantService(JdbcTemplate jdbc, TenantRlsContext tenantRlsContext, AuditService auditService) {
        this.jdbc = jdbc;
        this.tenantRlsContext = tenantRlsContext;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public AdminTenantDtos.Page list(
        CaresyncPrincipal actor, String search, String status, String plan, int page, int size
    ) {
        requirePlatformAdmin(actor);
        validatePage(page, size);
        tenantRlsContext.apply(actor, null);
        StringBuilder where = new StringBuilder(" WHERE TRUE");
        List<Object> args = new ArrayList<>();
        if (search != null && !search.isBlank()) {
            where.append(" AND (lower(t.name) LIKE ? ESCAPE '\\' OR lower(t.subdomain) LIKE ? ESCAPE '\\' "
                + "OR lower(coalesce(t.owner_email, '')) LIKE ? ESCAPE '\\')");
            String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
            args.add(pattern);
            args.add(pattern);
            args.add(pattern);
        }
        if (status != null && !status.isBlank()) {
            requireOneOf(status, "status", "ACTIVE", "INACTIVE", "SUSPENDED", "PENDING");
            where.append(" AND t.status = ?");
            args.add(status);
        }
        if (plan != null && !plan.isBlank()) {
            requireOneOf(plan, "plan", "FREE", "PRO", "ENTERPRISE");
            where.append(" AND t.plan = ?");
            args.add(plan);
        }
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM tenants t" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(size);
        pageArgs.add((long) page * size);
        List<AdminTenantDtos.Summary> content = jdbc.query(
            "SELECT t.id, t.name, t.subdomain, t.status, t.plan, t.owner_email, t.created_at, t.updated_at, "
                + "(SELECT COUNT(*) FROM firebase_users u WHERE u.tenant_id = t.id AND u.deleted_at IS NULL), "
                + "(SELECT COUNT(*) FROM patients p WHERE p.tenant_id = t.id) "
                + "FROM tenants t" + where + " ORDER BY t.created_at DESC, t.id LIMIT ? OFFSET ?",
            (rs, row) -> summary(rs),
            pageArgs.toArray()
        );
        int totalElements = total == null ? 0 : Math.toIntExact(total);
        int totalPages = totalElements == 0 ? 0 : (totalElements + size - 1) / size;
        return new AdminTenantDtos.Page(content, totalElements, totalPages, page, size);
    }

    @Transactional
    public AdminTenantDtos.Detail create(
        CaresyncPrincipal actor, AdminTenantDtos.CreateRequest request, HttpServletRequest servletRequest
    ) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        UUID id = UUID.randomUUID();
        try {
            jdbc.update("""
                INSERT INTO tenants (
                    id, name, subdomain, is_active, status, plan, description, timezone,
                    owner_name, owner_email, owner_phone, country, city, address
                ) VALUES (?, ?, ?, TRUE, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id, request.name().trim(), request.subdomain().trim(), request.plan(), nullable(request.description()),
                request.timezone().trim(), request.ownerName().trim(), request.ownerEmail().trim().toLowerCase(Locale.ROOT),
                nullable(request.ownerPhone()), nullable(request.country()), nullable(request.city()),
                nullable(request.address())
            );
        } catch (DuplicateKeyException exception) {
            throw new ConflictException("A tenant with this subdomain already exists");
        }
        auditService.recordAdministrativeAction(actor, id, "TENANT_CREATED", "TENANT", id.toString(), servletRequest);
        return get(actor, id);
    }

    @Transactional(readOnly = true)
    public AdminTenantDtos.Detail get(CaresyncPrincipal actor, UUID tenantId) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        AdminTenantDtos.DetailBase base = jdbc.query(
            """
            SELECT id, name, subdomain, description, status, plan, timezone, country, city, address,
                   created_at, updated_at, owner_email, owner_name, owner_phone
            FROM tenants WHERE id = ?
            """,
            (rs, row) -> detailBase(rs),
            tenantId
        ).stream().findFirst().orElseThrow(() -> new NotFoundException("Tenant not found"));
        return detail(actor, base);
    }

    @Transactional
    public AdminTenantDtos.Detail updateStatus(
        CaresyncPrincipal actor, UUID tenantId, String status, HttpServletRequest servletRequest
    ) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        requireOneOf(status, "status", "ACTIVE", "INACTIVE", "SUSPENDED", "PENDING");
        int updated = jdbc.update(
            "UPDATE tenants SET status = ?, is_active = ?, updated_at = NOW() WHERE id = ?",
            status, "ACTIVE".equals(status), tenantId
        );
        if (updated != 1) throw new NotFoundException("Tenant not found");
        auditService.recordAdministrativeAction(
            actor, tenantId, "TENANT_STATUS_UPDATED", "TENANT", tenantId.toString(), servletRequest
        );
        return get(actor, tenantId);
    }

    @Transactional(readOnly = true)
    public List<AdminTenantDtos.Provider> listProviders(CaresyncPrincipal actor, UUID tenantId) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        requireTenantExists(tenantId);
        return jdbc.query(
            """
            SELECT id, first_name, last_name, specialty
            FROM providers
            WHERE tenant_id = ? AND is_active = TRUE
            ORDER BY last_name, first_name, id
            """,
            (rs, row) -> new AdminTenantDtos.Provider(
                rs.getObject("id", UUID.class),
                rs.getString("first_name") + " " + rs.getString("last_name"),
                rs.getString("specialty")
            ),
            tenantId
        );
    }

    public void rejectDeletion(CaresyncPrincipal actor, UUID tenantId) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        requireTenantExists(tenantId);
        throw new ConflictException("Tenants cannot be deleted because tenant data and audit history must be retained. Set status to INACTIVE instead.");
    }

    private AdminTenantDtos.Detail detail(CaresyncPrincipal actor, AdminTenantDtos.DetailBase base) {
        UUID tenantId = base.id();
        long users = count("SELECT COUNT(*) FROM firebase_users WHERE tenant_id = ? AND deleted_at IS NULL", tenantId);
        long patients = count("SELECT COUNT(*) FROM patients WHERE tenant_id = ?", tenantId);
        long appointments = count(
            "SELECT COUNT(*) FROM appointments WHERE tenant_id = ? AND scheduled_start >= date_trunc('month', NOW()) "
                + "AND scheduled_start < date_trunc('month', NOW()) + INTERVAL '1 month'",
            tenantId
        );
        long invoices = count(
            "SELECT COUNT(*) FROM invoices WHERE tenant_id = ? AND created_at >= date_trunc('month', NOW()) "
                + "AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month'",
            tenantId
        );
        long providers = count("SELECT COUNT(*) FROM providers WHERE tenant_id = ? AND is_active = TRUE", tenantId);
        List<AdminTenantDtos.User> recentUsers = jdbc.query(
            """
            SELECT u.firebase_uid, p.full_name, u.email, u.role, u.disabled, u.created_at
            FROM firebase_users u
            LEFT JOIN user_profiles p ON p.firebase_uid = u.firebase_uid AND p.deleted_at IS NULL
            WHERE u.tenant_id = ? AND u.deleted_at IS NULL
            ORDER BY u.created_at DESC LIMIT 10
            """,
            (rs, row) -> new AdminTenantDtos.User(
                rs.getString("firebase_uid"), rs.getString("full_name"), rs.getString("email"),
                rs.getString("role"), rs.getBoolean("disabled") ? "SUSPENDED" : "ACTIVE",
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toInstant()
            ),
            tenantId
        );
        List<AdminTenantDtos.Audit> recentAudit = jdbc.query(
            """
            SELECT id, action, actor_user_id, resource_type, created_at
            FROM audit_logs WHERE tenant_id = ?
            ORDER BY created_at DESC LIMIT 10
            """,
            (rs, row) -> new AdminTenantDtos.Audit(
                Long.toString(rs.getLong("id")), rs.getString("action"), rs.getString("actor_user_id"),
                rs.getString("resource_type"), rs.getTimestamp("created_at").toInstant()
            ),
            tenantId
        );
        return new AdminTenantDtos.Detail(
            base.id(), base.name(), base.subdomain(), base.description(), base.status(), base.plan(),
            base.timezone(), base.country(), base.city(), base.address(), base.createdAt(), base.updatedAt(),
            base.ownerEmail(), base.ownerName(), base.ownerPhone(),
            new AdminTenantDtos.Stats(users, patients, appointments, null, invoices, providers),
            limits(base.plan()), recentUsers, recentAudit
        );
    }

    private void requireTenantExists(UUID tenantId) {
        Boolean exists = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM tenants WHERE id = ?)", Boolean.class, tenantId);
        if (!Boolean.TRUE.equals(exists)) throw new NotFoundException("Tenant not found");
    }

    private long count(String sql, UUID tenantId) {
        Long count = jdbc.queryForObject(sql, Long.class, tenantId);
        return count == null ? 0 : count;
    }

    private static AdminTenantDtos.Summary summary(ResultSet rs) throws SQLException {
        return new AdminTenantDtos.Summary(
            rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("subdomain"),
            rs.getString("status"), rs.getString("plan"), rs.getString("owner_email"),
            rs.getLong(9), rs.getLong(10), null, instant(rs, "created_at"), instant(rs, "updated_at")
        );
    }

    private static AdminTenantDtos.DetailBase detailBase(ResultSet rs) throws SQLException {
        return new AdminTenantDtos.DetailBase(
            rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("subdomain"),
            rs.getString("description"), rs.getString("status"), rs.getString("plan"),
            rs.getString("timezone"), rs.getString("country"), rs.getString("city"), rs.getString("address"),
            instant(rs, "created_at"), instant(rs, "updated_at"), rs.getString("owner_email"),
            rs.getString("owner_name"), rs.getString("owner_phone")
        );
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        return rs.getTimestamp(column) == null ? null : rs.getTimestamp(column).toInstant();
    }

    private static AdminTenantDtos.Limits limits(String plan) {
        return switch (plan) {
            case "FREE" -> new AdminTenantDtos.Limits(
                5, 100, 1024L, 5, List.of("Basic Appointments", "Clinical Notes", "Document Storage")
            );
            case "PRO" -> new AdminTenantDtos.Limits(
                50, 2500, 25600L, 50, List.of("Advanced Analytics", "Billing & Invoicing", "Document Storage")
            );
            case "ENTERPRISE" -> new AdminTenantDtos.Limits(
                null, null, null, null,
                List.of("Multi-location Support", "API Access", "Priority Support", "Custom Integrations")
            );
            default -> throw new ValidationException("Unsupported tenant plan");
        };
    }

    private static void requirePlatformAdmin(CaresyncPrincipal actor) {
        if (actor == null || !"SUPER_ADMIN".equals(actor.role())) {
            throw new ForbiddenException("Platform super-admin role required");
        }
    }

    private static void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
    }

    private static void requireOneOf(String value, String field, String... allowed) {
        for (String candidate : allowed) if (candidate.equals(value)) return;
        throw new ValidationException("Unsupported tenant " + field);
    }

    private static String nullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
