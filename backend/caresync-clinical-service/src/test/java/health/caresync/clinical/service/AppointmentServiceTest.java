package health.caresync.clinical.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

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
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;

class AppointmentServiceTest {
    private final AppointmentRepository appointments = mock(AppointmentRepository.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
    private final ProviderAvailabilityRepository availabilityRepository =
        mock(ProviderAvailabilityRepository.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private final AppointmentService service =
        new AppointmentService(
            appointments, jdbcTemplate, tenantRlsContext, availabilityRepository, eventPublisher
        );

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsAnAppointmentWithAnInvalidTimeRangeBeforeDatabaseAccess() {
        when(tenantRlsContext.apply()).thenReturn(UUID.randomUUID());
        Instant start = Instant.parse("2026-01-01T10:00:00Z");
        AppointmentCreateRequest request = new AppointmentCreateRequest(
            UUID.randomUUID(),
            UUID.randomUUID(),
            start,
            start,
            "CONSULTATION"
        );

        assertThrows(ValidationException.class, () -> service.create(request));
        verifyNoInteractions(appointments, jdbcTemplate);
    }

    @Test
    void transitionsScheduledAppointmentToCompleted() {
        UUID tenantId = UUID.randomUUID();
        UUID appointmentId = UUID.randomUUID();
        Appointment appointment = new Appointment();
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(appointments.findByIdAndTenantId(appointmentId, tenantId))
            .thenReturn(Optional.of(appointment));

        var response = service.changeStatus(
            appointmentId,
            new AppointmentStatusRequest(AppointmentStatus.COMPLETED)
        );

        assertEquals(AppointmentStatus.COMPLETED, response.status());
    }

    @Test
    void rejectsTransitionFromScheduledBackToScheduled() {
        UUID tenantId = UUID.randomUUID();
        UUID appointmentId = UUID.randomUUID();
        Appointment appointment = new Appointment();
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(appointments.findByIdAndTenantId(appointmentId, tenantId))
            .thenReturn(Optional.of(appointment));

        assertThrows(
            ValidationException.class,
            () -> service.changeStatus(
                appointmentId,
                new AppointmentStatusRequest(AppointmentStatus.SCHEDULED)
            )
        );
    }

    @Test
    void createsPendingBookingForTheAuthenticatedPatientAndPublishesEvent() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        UUID appointmentId = UUID.randomUUID();
        CaresyncPrincipal patient = new CaresyncPrincipal(
            "firebase-patient", tenantId, "PATIENT", "", "patient@example.com"
        );
        Instant start = Instant.parse("2030-01-07T10:00:00Z");
        Instant end = start.plusSeconds(1800);
        OnlineBookingRequest request = new OnlineBookingRequest(providerId, start, end, "CONSULTATION");
        ProviderAvailability availability = new ProviderAvailability();
        availability.setDayOfWeek((short) 1);
        availability.setStartTime(LocalTime.of(9, 0));
        availability.setEndTime(LocalTime.of(12, 0));
        availability.setSlotDurationMinutes(30);
        Appointment saved = new Appointment();
        saved.setTenantId(tenantId);
        saved.setPatientId(patientId);
        saved.setProviderId(providerId);
        saved.setScheduledStart(start);
        saved.setScheduledEnd(end);
        saved.setStatus(AppointmentStatus.PENDING_CONFIRMATION);
        saved.setAppointmentType(request.appointmentType());
        when(tenantRlsContext.apply(patient, tenantId)).thenReturn(tenantId);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(1);
        when(jdbcTemplate.queryForObject(anyString(), eq(UUID.class), any(Object[].class))).thenReturn(patientId);
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), any(Object[].class))).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            return !sql.contains("PENDING_CONFIRMATION");
        });
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(Object[].class))).thenReturn("UTC");
        when(availabilityRepository.findByTenantIdAndProviderIdAndDayOfWeekAndActiveTrue(
            tenantId, providerId, (short) 1
        )).thenReturn(java.util.List.of(availability));
        when(appointments.save(org.mockito.ArgumentMatchers.any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            appointment.setStatus(AppointmentStatus.PENDING_CONFIRMATION);
            return appointment;
        });

        AppointmentResponse response = service.createOnlineBooking(request, patient);

        assertEquals(patientId, response.patientId());
        assertEquals(AppointmentStatus.PENDING_CONFIRMATION, response.status());
        verify(availabilityRepository).findByTenantIdAndProviderIdAndDayOfWeekAndActiveTrue(
            tenantId, providerId, (short) 1
        );
        verify(eventPublisher).publishEvent(org.mockito.ArgumentMatchers.any(AppointmentBookedEvent.class));
    }

    @Test
    void rejectsBookingOutsideProviderAvailability() {
        UUID tenantId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        CaresyncPrincipal patient = new CaresyncPrincipal(
            "firebase-patient", tenantId, "PATIENT", "", "patient@example.com"
        );
        Instant start = Instant.parse("2030-01-07T10:00:00Z");
        when(tenantRlsContext.apply(patient, tenantId)).thenReturn(tenantId);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(1);
        when(jdbcTemplate.queryForObject(anyString(), eq(UUID.class), any(Object[].class)))
            .thenReturn(UUID.randomUUID());
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), any(Object[].class))).thenAnswer(invocation ->
            !invocation.<String>getArgument(0).contains("PENDING_CONFIRMATION")
        );
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(Object[].class))).thenReturn("UTC");
        when(availabilityRepository.findByTenantIdAndProviderIdAndDayOfWeekAndActiveTrue(
            tenantId, providerId, (short) 1
        )).thenReturn(java.util.List.of());

        assertThrows(
            ValidationException.class,
            () -> service.createOnlineBooking(
                new OnlineBookingRequest(providerId, start, start.plusSeconds(1800), "CONSULTATION"),
                patient
            )
        );
        verifyNoInteractions(appointments, eventPublisher);
    }

    @Test
    void createsAnonymousBookingWithoutPatientIdAndKeepsGuestDetailsUntilStaffLinksIt() {
        UUID tenantId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        Instant start = Instant.parse("2030-01-07T10:00:00Z");
        ProviderAvailability availability = new ProviderAvailability();
        availability.setDayOfWeek((short) 1);
        availability.setStartTime(LocalTime.of(9, 0));
        availability.setEndTime(LocalTime.of(12, 0));
        availability.setSlotDurationMinutes(30);
        doReturn(List.of(new AppointmentService.PublicTenant(tenantId)))
            .when(jdbcTemplate)
            .query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<AppointmentService.PublicTenant>>any(),
                any(Object[].class));
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(1);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(Object[].class))).thenReturn("UTC");
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), any(Object[].class))).thenAnswer(invocation ->
            !invocation.<String>getArgument(0).contains("PENDING_CONFIRMATION")
        );
        when(availabilityRepository.findByTenantIdAndProviderIdAndDayOfWeekAndActiveTrue(
            tenantId, providerId, (short) 1
        )).thenReturn(List.of(availability));
        when(appointments.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        AnonymousOnlineBookingRequest request = new AnonymousOnlineBookingRequest(
            providerId,
            start,
            start.plusSeconds(1800),
            "CONSULTATION",
            "Guest Patient",
            "guest@example.com",
            "+15551234567",
            "Central district"
        );

        AppointmentResponse response = service.createAnonymousOnlineBooking("caresync", request);

        assertNull(response.patientId());
        assertEquals(AppointmentStatus.PENDING_CONFIRMATION, response.status());
        verify(tenantRlsContext).applyPublicTenant(tenantId);
        var saved = org.mockito.ArgumentCaptor.forClass(Appointment.class);
        verify(appointments).save(saved.capture());
        assertEquals("Guest Patient", saved.getValue().getGuestName());
        assertEquals("guest@example.com", saved.getValue().getGuestEmail());
        assertEquals("+15551234567", saved.getValue().getGuestPhone());
        assertEquals("Central district", saved.getValue().getGuestLocation());
        verify(eventPublisher).publishEvent(org.mockito.ArgumentMatchers.any(AppointmentBookedEvent.class));
    }

    @Test
    void staffCanLinkPendingGuestBookingToPatientAndClearGuestDetails() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID appointmentId = UUID.randomUUID();
        Appointment appointment = new Appointment();
        appointment.setStatus(AppointmentStatus.PENDING_CONFIRMATION);
        appointment.setGuestName("Guest Patient");
        appointment.setGuestEmail("guest@example.com");
        appointment.setGuestPhone("+15551234567");
        appointment.setGuestLocation("Central district");
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(appointments.findByIdAndTenantId(appointmentId, tenantId)).thenReturn(Optional.of(appointment));
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), any(Object[].class))).thenReturn(true);

        AppointmentResponse response = service.linkGuestBooking(
            appointmentId,
            new LinkGuestBookingRequest(patientId)
        );

        assertEquals(patientId, response.patientId());
        assertNull(appointment.getGuestName());
        assertNull(appointment.getGuestEmail());
        assertNull(appointment.getGuestPhone());
        assertNull(appointment.getGuestLocation());
    }
}
