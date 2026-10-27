package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.PatientDocument;
import health.caresync.patient.domain.repository.PatientDocumentRepository;
import health.caresync.patient.service.PatientService;
import health.caresync.patient.storage.PatientDocumentStorageService;
import health.caresync.patient.storage.DocumentAccessLogService;
import health.caresync.patient.storage.SupabaseStorageClient;
import health.caresync.patient.storage.DocumentVersionService;
import java.io.IOException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

class PatientDocumentStorageServiceTest {
    @Test
    void uploadStoresFileAndPersistsProtectedMediaUrl() throws IOException {
        UUID patientId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        byte[] content = {1, 2, 3};
        SupabaseStorageClient storageClient = mock(SupabaseStorageClient.class);
        PatientDocumentRepository repository = mock(PatientDocumentRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        DocumentVersionService versionService = mock(DocumentVersionService.class);
        DocumentAccessLogService accessLogService = mock(DocumentAccessLogService.class);
        MultipartFile file = mock(MultipartFile.class);
        when(tenantContext.apply()).thenReturn(tenantId);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn((long) content.length);
        when(file.getOriginalFilename()).thenReturn("results.pdf");
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getBytes()).thenReturn(content);
        when(repository.saveAndFlush(any(PatientDocument.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        PatientDocumentStorageService service = new PatientDocumentStorageService(
            storageClient,
            "caresync-bucket",
            mock(PatientService.class),
            repository,
            tenantContext,
            versionService,
            accessLogService
        );

        var response = service.upload(patientId, file, "user-1", "request-1");

        assertEquals("results.pdf", response.fileName());
        assertEquals(
            "/api/v1/patients/" + patientId + "/documents/" + response.id() + "/content",
            response.mediaUrl()
        );
        verify(storageClient).upload(
            eq("caresync-bucket"),
            eq(tenantId + "/patients/" + patientId + "/documents/" + response.id()),
            eq("application/pdf"),
            eq(content)
        );
        verify(versionService).recordInitialVersion(
            eq(tenantId),
            eq(patientId),
            eq(response.id()),
            eq("results.pdf"),
            eq("application/pdf"),
            eq(content),
            eq("user-1")
        );
        verify(accessLogService).record(
            eq(tenantId), eq(patientId), eq(response.id()), eq("user-1"), eq("UPLOAD"), eq("request-1")
        );
    }

    @Test
    void uploadRemovesRemoteObjectWhenPostgresPersistenceFails() throws IOException {
        UUID patientId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        SupabaseStorageClient storageClient = mock(SupabaseStorageClient.class);
        PatientDocumentRepository repository = mock(PatientDocumentRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        MultipartFile file = mock(MultipartFile.class);
        when(tenantContext.apply()).thenReturn(tenantId);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1L);
        when(file.getOriginalFilename()).thenReturn("document.txt");
        when(file.getContentType()).thenReturn(null);
        when(file.getBytes()).thenReturn(new byte[] {1});
        when(repository.saveAndFlush(any(PatientDocument.class)))
            .thenThrow(new IllegalStateException("database failure"));

        PatientDocumentStorageService service = new PatientDocumentStorageService(
            storageClient,
            "caresync-bucket",
            mock(PatientService.class),
            repository,
            tenantContext,
            mock(DocumentVersionService.class),
            mock(DocumentAccessLogService.class)
        );

        assertThrows(
            IllegalStateException.class,
            () -> service.upload(patientId, file, "user-1", "request-1")
        );
        verify(storageClient).delete(eq("caresync-bucket"), any(String.class));
    }
}
