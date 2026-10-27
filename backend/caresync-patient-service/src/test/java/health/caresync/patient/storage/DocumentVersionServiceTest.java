package health.caresync.patient.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.patient.domain.entity.PatientDocument;
import health.caresync.patient.domain.entity.PatientDocumentVersion;
import health.caresync.patient.domain.repository.PatientDocumentRepository;
import health.caresync.patient.domain.repository.PatientDocumentVersionRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentVersionServiceTest {
    @Mock
    private SupabaseStorageClient storageClient;

    @Mock
    private PatientDocumentRepository documentRepository;

    @Mock
    private PatientDocumentVersionRepository versionRepository;

    @Test
    void createsRevisionAndReplacesCurrentDocument() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        byte[] oldContent = {1, 2};
        byte[] newContent = {3, 4, 5};
        String baseKey = tenantId + "/patients/" + patientId + "/documents/" + documentId;
        PatientDocument document = document(documentId, patientId, "old.pdf", oldContent.length);
        when(documentRepository.lockByDocumentIdAndTenantIdAndPatientId(documentId, tenantId, patientId))
            .thenReturn(Optional.of(document));
        when(storageClient.download("bucket", baseKey))
            .thenReturn(new SupabaseStorageClient.StoredObject(oldContent, "application/pdf"));
        when(versionRepository.findMaxVersionNumber(tenantId, patientId, documentId)).thenReturn(1);
        when(versionRepository.saveAndFlush(any(PatientDocumentVersion.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(documentRepository.saveAndFlush(document)).thenReturn(document);

        PatientDocumentVersion result = service().createVersion(
            tenantId, patientId, documentId, "new.pdf", "application/pdf", newContent, "user-1"
        );

        assertEquals(2, result.getVersionNumber());
        assertEquals("new.pdf", document.getFileName());
        assertEquals(newContent.length, document.getSizeBytes());
        verify(storageClient).upload(
            "bucket", baseKey + "/versions/2", "application/pdf", newContent
        );
        verify(storageClient).uploadReplacing("bucket", baseKey, "application/pdf", newContent);
    }

    @Test
    void recordsExistingCurrentContentBeforeFirstRevision() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        byte[] oldContent = {1};
        byte[] newContent = {2, 3};
        String baseKey = tenantId + "/patients/" + patientId + "/documents/" + documentId;
        PatientDocument document = document(documentId, patientId, "legacy.pdf", oldContent.length);
        when(documentRepository.lockByDocumentIdAndTenantIdAndPatientId(documentId, tenantId, patientId))
            .thenReturn(Optional.of(document));
        when(storageClient.download("bucket", baseKey))
            .thenReturn(new SupabaseStorageClient.StoredObject(oldContent, "application/pdf"));
        when(versionRepository.findMaxVersionNumber(tenantId, patientId, documentId)).thenReturn(0);
        when(versionRepository.saveAndFlush(any(PatientDocumentVersion.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(documentRepository.saveAndFlush(document)).thenReturn(document);

        PatientDocumentVersion result = service().createVersion(
            tenantId, patientId, documentId, "new.pdf", "application/pdf", newContent, "user-1"
        );

        assertEquals(2, result.getVersionNumber());
        ArgumentCaptor<PatientDocumentVersion> versions = ArgumentCaptor.forClass(PatientDocumentVersion.class);
        verify(versionRepository, org.mockito.Mockito.times(2)).saveAndFlush(versions.capture());
        assertEquals(1, versions.getAllValues().get(0).getVersionNumber());
        assertEquals("legacy.pdf", versions.getAllValues().get(0).getFileName());
        assertEquals(2, versions.getAllValues().get(1).getVersionNumber());
        verify(storageClient).upload("bucket", baseKey + "/versions/1", "application/pdf", oldContent);
    }

    @Test
    void restoresCurrentObjectWhenDatabaseUpdateFails() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        byte[] oldContent = {1};
        byte[] newContent = {2};
        String baseKey = tenantId + "/patients/" + patientId + "/documents/" + documentId;
        PatientDocument document = document(documentId, patientId, "old.pdf", oldContent.length);
        when(documentRepository.lockByDocumentIdAndTenantIdAndPatientId(documentId, tenantId, patientId))
            .thenReturn(Optional.of(document));
        when(storageClient.download("bucket", baseKey))
            .thenReturn(new SupabaseStorageClient.StoredObject(oldContent, "application/pdf"));
        when(versionRepository.findMaxVersionNumber(tenantId, patientId, documentId)).thenReturn(1);
        when(documentRepository.saveAndFlush(document)).thenThrow(new IllegalStateException("database failure"));

        assertThrows(IllegalStateException.class, () -> service().createVersion(
            tenantId, patientId, documentId, "new.pdf", "application/pdf", newContent, "user-1"
        ));

        verify(storageClient).uploadReplacing("bucket", baseKey, "application/pdf", oldContent);
        verify(storageClient).delete("bucket", baseKey + "/versions/2");
    }

    private DocumentVersionService service() {
        return new DocumentVersionService(
            storageClient, "bucket", documentRepository, versionRepository
        );
    }

    private PatientDocument document(UUID documentId, UUID patientId, String fileName, long size) {
        return new PatientDocument(
            documentId,
            patientId,
            fileName,
            "application/pdf",
            size,
            "/content",
            Instant.parse("2026-10-27T08:00:00Z")
        );
    }
}
