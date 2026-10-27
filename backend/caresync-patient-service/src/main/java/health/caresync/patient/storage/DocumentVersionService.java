package health.caresync.patient.storage;

import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.patient.domain.entity.PatientDocument;
import health.caresync.patient.domain.entity.PatientDocumentVersion;
import health.caresync.patient.domain.repository.PatientDocumentRepository;
import health.caresync.patient.domain.repository.PatientDocumentVersionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
public class DocumentVersionService {
    private final SupabaseStorageClient storageClient;
    private final String bucket;
    private final PatientDocumentRepository documentRepository;
    private final PatientDocumentVersionRepository versionRepository;

    public DocumentVersionService(
        SupabaseStorageClient storageClient,
        @Value("${caresync.storage.bucket:caresync-bucket}") String bucket,
        PatientDocumentRepository documentRepository,
        PatientDocumentVersionRepository versionRepository
    ) {
        this.storageClient = storageClient;
        this.bucket = bucket;
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
    }

    @Transactional
    public PatientDocumentVersion recordInitialVersion(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        String fileName,
        String contentType,
        byte[] content,
        String actorId
    ) {
        String storageKey = versionKey(tenantId, patientId, documentId, 1);
        try {
            storageClient.upload(bucket, storageKey, contentType, content);
            return versionRepository.saveAndFlush(new PatientDocumentVersion(
                tenantId,
                patientId,
                documentId,
                1,
                fileName,
                contentType,
                content.length,
                storageKey,
                actorId
            ));
        } catch (RuntimeException failure) {
            deleteRemoteObject(storageKey, failure);
            throw failure;
        }
    }

    @Transactional(readOnly = true)
    public List<PatientDocumentVersion> list(UUID tenantId, UUID patientId, UUID documentId) {
        documentRepository.findByIdAndTenantIdAndPatientId(documentId, tenantId, patientId)
            .orElseThrow(() -> new NotFoundException("Patient document not found"));
        return versionRepository.findAllByTenantIdAndPatientIdAndDocumentIdOrderByVersionNumberDesc(
            tenantId, patientId, documentId
        );
    }

    @Transactional
    public PatientDocumentVersion createVersion(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        String fileName,
        String contentType,
        byte[] content,
        String actorId
    ) {
        PatientDocument document = documentRepository
            .lockByDocumentIdAndTenantIdAndPatientId(documentId, tenantId, patientId)
            .orElseThrow(() -> new NotFoundException("Patient document not found"));
        String currentKey = currentKey(tenantId, patientId, documentId);
        SupabaseStorageClient.StoredObject previousObject = storageClient.download(bucket, currentKey);
        int existingMax = versionRepository.findMaxVersionNumber(tenantId, patientId, documentId);
        if (existingMax == Integer.MAX_VALUE) {
            throw new ValidationException("Document has reached the maximum supported version number");
        }
        List<String> uploadedKeys = new ArrayList<>();
        boolean currentReplaceAttempted = false;

        try {
            int nextVersion = existingMax + 1;
            if (existingMax == 0) {
                String initialKey = versionKey(tenantId, patientId, documentId, 1);
                uploadedKeys.add(initialKey);
                storageClient.upload(bucket, initialKey, document.getContentType(), previousObject.content());
                versionRepository.saveAndFlush(new PatientDocumentVersion(
                    tenantId,
                    patientId,
                    documentId,
                    1,
                    document.getFileName(),
                    document.getContentType(),
                    document.getSizeBytes(),
                    initialKey,
                    actorId
                ));
                nextVersion = 2;
            }

            String newVersionKey = versionKey(tenantId, patientId, documentId, nextVersion);
            uploadedKeys.add(newVersionKey);
            storageClient.upload(bucket, newVersionKey, contentType, content);
            currentReplaceAttempted = true;
            storageClient.uploadReplacing(bucket, currentKey, contentType, content);

            document.updateContent(fileName, contentType, content.length, Instant.now());
            documentRepository.saveAndFlush(document);
            return versionRepository.saveAndFlush(new PatientDocumentVersion(
                tenantId,
                patientId,
                documentId,
                nextVersion,
                fileName,
                contentType,
                content.length,
                newVersionKey,
                actorId
            ));
        } catch (RuntimeException failure) {
            if (currentReplaceAttempted) {
                try {
                    storageClient.uploadReplacing(
                        bucket, currentKey, previousObject.contentType(), previousObject.content()
                    );
                } catch (RuntimeException restoreFailure) {
                    failure.addSuppressed(restoreFailure);
                }
            }
            for (String uploadedKey : uploadedKeys) {
                deleteRemoteObject(uploadedKey, failure);
            }
            throw failure;
        }
    }

    @Transactional
    public PatientDocumentVersion restore(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        int versionNumber,
        String actorId
    ) {
        PatientDocumentVersion source = versionRepository
            .findByTenantIdAndPatientIdAndDocumentIdAndVersionNumber(
                tenantId, patientId, documentId, versionNumber
            )
            .orElseThrow(() -> new NotFoundException("Patient document version not found"));
        SupabaseStorageClient.StoredObject object = storageClient.download(bucket, source.getStorageKey());
        return createVersion(
            tenantId,
            patientId,
            documentId,
            source.getFileName(),
            source.getContentType(),
            object.content(),
            actorId
        );
    }

    @Transactional
    public void deleteVersions(UUID tenantId, UUID patientId, UUID documentId) {
        List<PatientDocumentVersion> versions =
            versionRepository.findAllByTenantIdAndPatientIdAndDocumentIdOrderByVersionNumberDesc(
                tenantId, patientId, documentId
            );
        for (PatientDocumentVersion version : versions) {
            storageClient.delete(bucket, version.getStorageKey());
        }
        versionRepository.deleteAll(versions);
    }

    private void deleteRemoteObject(String storageKey, RuntimeException originalFailure) {
        try {
            storageClient.delete(bucket, storageKey);
        } catch (RuntimeException cleanupFailure) {
            originalFailure.addSuppressed(cleanupFailure);
        }
    }

    private static String currentKey(UUID tenantId, UUID patientId, UUID documentId) {
        return tenantId + "/patients/" + patientId + "/documents/" + documentId;
    }

    private static String versionKey(UUID tenantId, UUID patientId, UUID documentId, int versionNumber) {
        return currentKey(tenantId, patientId, documentId) + "/versions/" + versionNumber;
    }
}