package health.caresync.clinical.service;

import health.caresync.clinical.domain.Appointment;
import health.caresync.clinical.domain.AppointmentRepository;
import health.caresync.clinical.domain.AppointmentStatus;
import health.caresync.clinical.domain.entity.ProviderAvailability;
import health.caresync.clinical.domain.repository.ProviderAvailabilityRepository;
import health.caresync.clinical.dto.AnonymousOnlineBookingRequest;
import health.caresync.clinical.dto.AppointmentCreateRequest;
import health.caresync.clinical.dto.AppointmentResponse;
import health.caresync.clinical.dto.AppointmentStatusRequest;
import health.caresync.clinical.dto.LinkGuestBookingRequest;
import health.caresync.clinical.dto.OnlineBookingRequest;
import health.caresync.clinical.event.AppointmentBookedEvent;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {
    private final AppointmentRepository appointments;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;
    private final ProviderAvailabilityRepository availabilityRepository;
    private final ApplicationEventPublisher eventPublisher;

    public AppointmentService(
        AppointmentRepository appointments,
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext,
        ProviderAvailabilityRepository availabilityRepository,
        ApplicationEventPublisher eventPublisher
    ) {
        this.appointments = appointments;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
        this.availabilityRepository = availabilityRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public AppointmentResponse create(AppointmentCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        validateTimeRange(request.scheduledStart(), request.scheduledEnd());
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
            : appointments.findTop100ByTenantIdAndProviderIdOrderByScheduledStartAsc(tenantId, providerId))
            .stream()
            .map(AppointmentService::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsForPatient(String patientId) {
        UUID tenantId = tenantRlsContext.apply();
        UUID parsedPatientId;
        try {
            parsedPatientId = UUID.fromString(patientId);
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Patient ID must be a UUID");
        }
        UUID providerId = providerIdForCurrentProvider(tenantId);
        List<Appointment> scoped = providerId == null
            ? appointments.findTop100ByTenantIdAndPatientIdOrderByScheduledStartAsc(tenantId, parsedPatientId)
            : appointments.findTop100ByTenantIdAndPatientIdAndProviderIdOrderByScheduledStartAsc(
                tenantId, parsedPatientId, providerId
            );
        return scoped.stream().map(AppointmentService::toResponse).toList();
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
            throw new ValidationException(
                "Only a scheduled appointment can be completed, cancelled, or marked no-show"
            );
        }
        appointment.setStatus(next);
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse updateStatus(UUID id, String status) {
        AppointmentStatus requestedStatus;
        try {
            requestedStatus = AppointmentStatus.valueOf(status == null ? "" : status.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Appointment status is invalid");
        }
        return changeStatus(id, new AppointmentStatusRequest(requestedStatus));
    }

    @Transactional
    public AppointmentResponse bookAppointment(
        UUID patientId,
        UUID providerId,
        Instant start,
        Instant end,
        String appointmentType
    ) {
        return create(new AppointmentCreateRequest(patientId, providerId, start, end, appointmentType));
    }

    @Transactional
    public AppointmentResponse createOnlineBooking(OnlineBookingRequest request, CaresyncPrincipal patient) {
        if (patient == null || !"PATIENT".equals(patient.role())) {
            throw new ForbiddenException("An authenticated patient is required to book online");
        }
        UUID tenantId = tenantRlsContext.apply(patient, patient.tenantId());
        validateTimeRange(request.scheduledStart(), request.scheduledEnd());
        UUID patientId = findPatientForUser(tenantId, patient.userId());
        requireActiveTenantProvider(tenantId, request.providerId());
        requireProviderAvailability(
            tenantId, request.providerId(), request.scheduledStart(), request.scheduledEnd()
        );
        lockProviderSchedule(tenantId, request.providerId());
        requireNoScheduleConflict(tenantId, request.providerId(), request.scheduledStart(), request.scheduledEnd());

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenantId);
        appointment.setPatientId(patientId);
        appointment.setProviderId(request.providerId());
        appointment.setScheduledStart(request.scheduledStart());
        appointment.setScheduledEnd(request.scheduledEnd());
        appointment.setAppointmentType(normalizeAppointmentType(request.appointmentType()));
        appointment.setStatus(AppointmentStatus.PENDING_CONFIRMATION);
        Appointment saved = appointments.save(appointment);
        publishBooking(saved);
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse createAnonymousOnlineBooking(
        String tenantSlug,
        AnonymousOnlineBookingRequest request
    ) {
        if (tenantSlug == null || !tenantSlug.matches("[a-zA-Z0-9][a-zA-Z0-9-]{0,98}[a-zA-Z0-9]")) {
            throw new NotFoundException("Clinic not found");
        }
        UUID tenantId = jdbcTemplate.query(
            "select id from tenants where lower(subdomain) = lower(?) and is_active = true",
            (resultSet, rowNumber) -> new PublicTenant(
                UUID.fromString(resultSet.getString("id"))
            ),
            new Object[] { tenantSlug }
        ).stream().map(PublicTenant::id).findFirst()
            .orElseThrow(() -> new NotFoundException("Clinic not found"));
        tenantRlsContext.applyPublicTenant(tenantId);

        validateTimeRange(request.scheduledStart(), request.scheduledEnd());
        requireActiveTenantProvider(tenantId, request.providerId());
        requireProviderAvailability(
            tenantId, request.providerId(), request.scheduledStart(), request.scheduledEnd()
        );
        lockProviderSchedule(tenantId, request.providerId());
        requireNoScheduleConflict(tenantId, request.providerId(), request.scheduledStart(), request.scheduledEnd());

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenantId);
        appointment.setProviderId(request.providerId());
        appointment.setScheduledStart(request.scheduledStart());
        appointment.setScheduledEnd(request.scheduledEnd());
        appointment.setAppointmentType(normalizeAppointmentType(request.appointmentType()));
        appointment.setStatus(AppointmentStatus.PENDING_CONFIRMATION);
        appointment.setGuestName(request.name().strip());
        appointment.setGuestEmail(request.email().strip().toLowerCase(Locale.ROOT));
        appointment.setGuestPhone(request.phone().strip());
        appointment.setGuestLocation(request.location() == null ? null : request.location().strip());
        Appointment saved = appointments.save(appointment);
        publishBooking(saved);
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse linkGuestBooking(UUID appointmentId, LinkGuestBookingRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        Appointment appointment = appointments.findByIdAndTenantId(appointmentId, tenantId)
            .orElseThrow(() -> new NotFoundException("Appointment not found"));
        if (appointment.getStatus() != AppointmentStatus.PENDING_CONFIRMATION
            || appointment.getPatientId() != null || appointment.getGuestName() == null) {
            throw new ValidationException("Only a pending guest booking can be linked to a patient");
        }
        requireTenantPatient(tenantId, request.patientId());
        appointment.setPatientId(request.patientId());
        appointment.setGuestName(null);
        appointment.setGuestEmail(null);
        appointment.setGuestPhone(null);
        appointment.setGuestLocation(null);
        appointments.save(appointment);
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

    private UUID findPatientForUser(UUID tenantId, String firebaseUid) {
        try {
            return jdbcTemplate.queryForObject(
            "select id from patients where tenant_id = ? and firebase_uid = ? and merged_into_patient_id is null",
            UUID.class,
            tenantId,
            firebaseUid
            );
        } catch (EmptyResultDataAccessException exception) {
            throw new NotFoundException("Patient profile not found");
        }
    }

    private void requireActiveTenantProvider(UUID tenantId, UUID providerId) {
        Integer active = jdbcTemplate.queryForObject(
            "select count(*) from providers where tenant_id = ? and id = ? and is_active = true",
            Integer.class,
            tenantId,
            providerId
        );
        if (active == null || active == 0) {
            throw new NotFoundException("Active provider not found");
        }
    }

    private void requireProviderAvailability(UUID tenantId, UUID providerId, Instant start, Instant end) {
        String timezone = jdbcTemplate.queryForObject(
            "select timezone from tenants where id = ? and is_active = true",
            String.class,
            tenantId
        );
        ZoneId zone;
        try {
            zone = ZoneId.of(timezone == null ? "UTC" : timezone);
        } catch (RuntimeException exception) {
            throw new ValidationException("Clinic timezone is invalid");
        }
        LocalDateTime localStart = LocalDateTime.ofInstant(start, zone);
        LocalDateTime localEnd = LocalDateTime.ofInstant(end, zone);
        if (!localStart.toLocalDate().equals(localEnd.toLocalDate())) {
            throw new ValidationException("Appointment must start and end on the same local day");
        }

        short dayOfWeek = (short) localStart.getDayOfWeek().getValue();
        List<ProviderAvailability> schedules =
            availabilityRepository.findByTenantIdAndProviderIdAndDayOfWeekAndActiveTrue(
                tenantId, providerId, dayOfWeek
            );
        boolean available = schedules.stream().anyMatch(schedule ->
            (schedule.getEffectiveFrom() == null || !localStart.toLocalDate().isBefore(schedule.getEffectiveFrom()))
                && (schedule.getEffectiveUntil() == null
                    || !localStart.toLocalDate().isAfter(schedule.getEffectiveUntil()))
                && !localStart.toLocalTime().isBefore(schedule.getStartTime())
                && !localEnd.toLocalTime().isAfter(schedule.getEndTime())
                && Duration.between(start, end).toMinutes() == schedule.getSlotDurationMinutes()
        );
        if (!available) {
            throw new ValidationException("Provider is not available during the requested appointment time");
        }
    }

    private void lockProviderSchedule(UUID tenantId, UUID providerId) {
        jdbcTemplate.queryForObject(
            "select pg_advisory_xact_lock(hashtextextended(?, 0))",
            String.class,
            tenantId + ":" + providerId
        );
    }

    private void requireNoScheduleConflict(UUID tenantId, UUID providerId, Instant start, Instant end) {
        Boolean conflict = jdbcTemplate.queryForObject(
            """
            select exists(
                select 1 from appointments
                where tenant_id = ? and provider_id = ?
                    and status in ('SCHEDULED', 'PENDING_CONFIRMATION')
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
            "select id from providers where tenant_id = ? and user_id = ? and is_active = true",
            (resultSet, rowNumber) -> UUID.fromString(resultSet.getString("id")),
            tenantId,
            principal.userId()
        ).stream().findFirst().orElse(null);
        if (providerId == null) {
            throw new ForbiddenException("Active provider profile required");
        }
        return providerId;
    }

    private static void validateTimeRange(Instant start, Instant end) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new ValidationException("Appointment end must be after its start");
        }
    }

    private static String normalizeAppointmentType(String value) {
        if (value == null || value.isBlank()) {
            return "CONSULTATION";
        }
        String normalized = value.strip().toUpperCase(Locale.ROOT);
        if (!normalized.matches("[A-Z][A-Z0-9_]{0,49}")) {
            throw new ValidationException("Appointment type is invalid");
        }
        return normalized;
    }

    private void publishBooking(Appointment appointment) {
        eventPublisher.publishEvent(new AppointmentBookedEvent(
            appointment.getTenantId(),
            appointment.getId(),
            appointment.getPatientId(),
            appointment.getProviderId(),
            appointment.getScheduledStart(),
            appointment.getScheduledEnd(),
            appointment.getAppointmentType(),
            appointment.getGuestName(),
            appointment.getGuestEmail(),
            appointment.getGuestPhone(),
            appointment.getGuestLocation()
        ));
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

    public record PublicTenant(UUID id) { }
}
