package health.caresync.patient.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentAccessLogServiceTest {
    @Mock
    private DocumentAccessLogRepository repository;

    @Mock
    private TenantRlsContext tenantRlsContext;

    @Test
    void recordsCollectionReadWithoutDocumentId() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(repository.save(any(DocumentAccessLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        DocumentAccessLog log = new DocumentAccessLogService(repository, tenantRlsContext).record(
            tenantId, patientId, null, "actor-1", "LIST", "request-1"
        );

        assertEquals("LIST", log.getAction());
        assertEquals(patientId, log.getPatientId());
        assertEquals("request-1", log.getCorrelationId());
        verify(repository).save(any(DocumentAccessLog.class));
    }

    @Test
    void rejectsTenantMismatchAndInvalidAccessData() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        when(tenantRlsContext.apply()).thenReturn(UUID.randomUUID());
        DocumentAccessLogService service = new DocumentAccessLogService(repository, tenantRlsContext);

        assertThrows(
            ForbiddenException.class,
            () -> service.record(tenantId, patientId, UUID.randomUUID(), "actor-1", "DOWNLOAD", null)
        );

        when(tenantRlsContext.apply()).thenReturn(tenantId);
        assertThrows(
            ValidationException.class,
            () -> service.record(tenantId, patientId, null, "actor-1", "DOWNLOAD", null)
        );
    }
}
