package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.controller.PatientMergeController;
import health.caresync.patient.service.PatientMergeService;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PatientMergeControllerTest {
    private final PatientMergeService service = org.mockito.Mockito.mock(PatientMergeService.class);
    private final PatientMergeController controller = new PatientMergeController(service);

    @Test
    void rejectsTenantMismatchBeforeCallingMergeService() {
        UUID pathTenant = UUID.randomUUID();
        CaresyncPrincipal principal = new CaresyncPrincipal(
            "user-1", UUID.randomUUID(), "ADMIN", "COMMON", "user@example.test"
        );

        assertThrows(
            ForbiddenException.class,
            () -> controller.getStatistics(pathTenant, principal, new org.springframework.mock.web.MockHttpServletRequest())
        );

        verify(service, never()).getStatistics(org.mockito.ArgumentMatchers.any());
    }
}