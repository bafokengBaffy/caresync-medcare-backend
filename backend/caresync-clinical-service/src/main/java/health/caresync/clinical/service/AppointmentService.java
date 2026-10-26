package health.caresync.clinical.service;

import health.caresync.clinical.domain.Appointment;
import health.caresync.clinical.domain.AppointmentRepository;
import health.caresync.clinical.domain.AppointmentStatus;
import health.caresync.clinical.dto.AppointmentCreateRequest;
import health.caresync.clinical.dto.AppointmentResponse;
import health.caresync.clinical.dto.AppointmentStatusRequest;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {
    private final AppointmentRepository appointments;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;

    public AppointmentService(
        AppointmentRepository appointments,
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext
    ) {
        this.appointments = appointments;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public AppointmentResponse create(AppointmentCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (!request.scheduledEnd().isAfter(request.scheduledStart())) {
            throw new ValidationException("Appointment end must be after its start");
        }
        requireTenantPatient(tenantId, request.patientId());
        requireActiveTenantProvider(tenantId, request.providerId());
        lockProviderSchedule(tenantId, request.providerId());
        requireNoScheduleConflict(tenantId, request.providerId(), request.scheduledStart(), request.scheduledEnd());

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenantId);
        appointment.setPatientId(request.patientId());
        appointment.setProviderId(request.providerId());
        appointment.setScheduledStart(request.scheduledStart());
        appointment.setScheduledEnd(request.scheduledEnd());
        appointment.setAppointmentType(request.appointmentType());
        return toResponse(appointments.save(appointment));
    }

    @Transactional(readOnly = true)
    public AppointmentResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = providerIdForCurrentProvider(tenantId);
        return (providerId == null
            ? appointments.findByIdAndTenantId(id, tenantId)
            : appointments.findByIdAndTenantIdAndProviderId(id, tenantId, providerId))
            .map(AppointmentService::toResponse)
            .orElseThrow(() -> new NotFoundException("Appointment not found"));
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> list() {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = providerIdForCurrentProvider(tenantId);
        return (providerId == null
            ? appointments.findTop100ByTenantIdOrderByScheduledStartAsc(tenantId)
            : appointments.findTop100ByTenantIdAndProviderIdOrderByScheduledStartAsc(tenantId, providerId)).stream()
            .map(AppointmentService::toResponse)
            .toList();
    }

    @Transactional
    public AppointmentResponse changeStatus(UUID id, AppointmentStatusRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = providerIdForCurrentProvider(tenantId);
        Appointment appointment = (providerId == null
            ? appointments.findByIdAndTenantId(id, tenantId)
            : appointments.findByIdAndTenantIdAndProviderId(id, tenantId, providerId))
            .orElseThrow(() -> new NotFoundException("Appointment not found"));
        AppointmentStatus current = appointment.getStatus();
        AppointmentStatus next = request.status();
        if (current != AppointmentStatus.SCHEDULED || next == AppointmentStatus.SCHEDULED) {
            throw new ValidationException("Only a scheduled appointment can be completed, cancelled, or marked no-show");
        }
        appointment.setStatus(next);
        return toResponse(appointment);
    }

    private void requireTenantPatient(UUID tenantId, UUID patientId) {
        Boolean found = jdbcTemplate.queryForObject(
            "select exists(select 1 from patients where tenant_id = ? and id = ?)",
            Boolean.class,
            tenantId,
            patientId
        );
        if (!Boolean.TRUE.equals(found)) {
            throw new NotFoundException("Patient not found");
        }
    }

    private void requireActiveTenantProvider(UUID tenantId, UUID providerId) {
        Boolean active = jdbcTemplate.query(
            "select is_active from providers where tenant_id = ? and id = ?",
            resultSet -> resultSet.next() && resultSet.getBoolean(1),
            tenantId,
            providerId
        );
        if (!Boolean.TRUE.equals(active)) {
            throw new NotFoundException("Active provider not found");
        }
    }

    private void lockProviderSchedule(UUID tenantId, UUID providerId) {
        jdbcTemplate.query(
            "select pg_advisory_xact_lock(hashtextextended(?, 0))",
            resultSet -> {
                resultSet.next();
                return null;
            },
            tenantId + ":" + providerId
        );
    }

    private void requireNoScheduleConflict(
        UUID tenantId,
        UUID providerId,
        java.time.Instant start,
        java.time.Instant end
    ) {
        Boolean conflict = jdbcTemplate.queryForObject(
            """
            select exists(
                select 1 from appointments
                where tenant_id = ? and provider_id = ? and status = 'SCHEDULED'
                    and scheduled_start < ? and scheduled_end > ?
            ) or exists(
                select 1 from provider_time_off
                where tenant_id = ? and provider_id = ?
                    and start_at < ? and end_at > ?
            )
            """,
            Boolean.class,
            tenantId, providerId, end, start,
            tenantId, providerId, end, start
        );
        if (Boolean.TRUE.equals(conflict)) {
            throw new ValidationException("Provider is unavailable during the requested appointment time");
        }
    }

    private UUID providerIdForCurrentProvider(UUID tenantId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CaresyncPrincipal principal)
            || !"PROVIDER".equals(principal.role())) {
            return null;
        }
        UUID providerId = jdbcTemplate.query(
            "select id from providers where tenant_id = ? and user_id = ? and is_active",
            resultSet -> resultSet.next() ? UUID.fromString(resultSet.getString(1)) : null,
            tenantId,
            principal.userId()
        );
        if (providerId == null) {
            throw new ForbiddenException("Active provider profile required");
        }
        return providerId;
    }

    private static AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
            appointment.getId(),
            appointment.getPatientId(),
            appointment.getProviderId(),
            appointment.getScheduledStart(),
            appointment.getScheduledEnd(),
            appointment.getStatus(),
            appointment.getAppointmentType()
        );
    }
}
