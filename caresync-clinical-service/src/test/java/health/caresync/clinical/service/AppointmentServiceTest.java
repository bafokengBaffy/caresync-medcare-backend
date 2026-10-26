package health.caresync.clinical.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import health.caresync.clinical.domain.Appointment;
import health.caresync.clinical.domain.AppointmentRepository;
import health.caresync.clinical.domain.AppointmentStatus;
import health.caresync.clinical.dto.AppointmentCreateRequest;
import health.caresync.clinical.dto.AppointmentStatusRequest;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;

class AppointmentServiceTest {
    private final AppointmentRepository appointments = mock(AppointmentRepository.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
    private final AppointmentService service =
        new AppointmentService(appointments, jdbcTemplate, tenantRlsContext);

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
}
