package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.controller.ConsentController;
import health.caresync.patient.dto.ConsentCreateRequest;
import health.caresync.patient.dto.ConsentResponse;
import health.caresync.patient.service.ConsentService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

class ConsentControllerTest {
    private final ConsentService service = org.mockito.Mockito.mock(ConsentService.class);
    private final ConsentController controller = new ConsentController(service);

    @Test
    void rejectsRequestForDifferentTenantBeforeCallingService() {
        UUID pathTenant = UUID.randomUUID();
        CaresyncPrincipal principal = new CaresyncPrincipal(
            "user-1", UUID.randomUUID(), "ADMIN", "COMMON", "user@example.test"
        );

        assertThrows(
            ForbiddenException.class,
            () -> controller.createConsent(
                pathTenant,
                UUID.randomUUID(),
                new ConsentCreateRequest("TREATMENT", "Care delivery", null),
                principal,
                "key-1",
                new MockHttpServletRequest()
            )
        );

        verify(service, never()).createConsent(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void createsConsentAndEchoesCorrelationId() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        CaresyncPrincipal principal = new CaresyncPrincipal(
            "user-1", tenantId, "ADMIN", "COMMON", "user@example.test"
        );
        ConsentCreateRequest request = new ConsentCreateRequest("TREATMENT", "Care delivery", null);
        ConsentResponse expected = new ConsentResponse(
            UUID.randomUUID(), patientId, "TREATMENT", "GRANTED", "Care delivery",
            Instant.parse("2026-01-02T03:04:05Z"), null, null, null,
            "user-1", "user-1", Instant.parse("2026-01-02T03:04:05Z"),
            Instant.parse("2026-01-02T03:04:05Z")
        );
        when(service.createConsent(tenantId, patientId, request, "user-1", "key-1", "correlation-1"))
            .thenReturn(expected);
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.addHeader("X-Correlation-Id", "correlation-1");

        var response = controller.createConsent(
            tenantId, patientId, request, principal, "key-1", servletRequest
        );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("correlation-1", response.getHeaders().getFirst("X-Correlation-Id"));
        assertEquals(expected, response.getBody().data());
        verify(service).createConsent(tenantId, patientId, request, "user-1", "key-1", "correlation-1");
    }
}