package health.caresync.patient.storage;

import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.PatientDocument;
import health.caresync.patient.domain.repository.PatientDocumentRepository;
import health.caresync.patient.dto.PatientDocumentResponse;
import health.caresync.patient.service.PatientService;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
public class PatientDocumentStorageService {
    private static final long MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
    private static final int MAX_FILE_NAME_LENGTH = 255;
    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private final SupabaseStorageClient storageClient;
    private final String bucket;
    private final PatientService patientService;
    private final PatientDocumentRepository documentRepository;
    private final TenantRlsContext tenantRlsContext;
    private final DocumentVersionService documentVersionService;
    private final DocumentAccessLogService accessLogService;

    public PatientDocumentStorageService(
        SupabaseStorageClient storageClient,
        @Value("${caresync.storage.bucket:caresync-bucket}") String bucket,
        PatientService patientService,
        PatientDocumentRepository documentRepository,
        TenantRlsContext tenantRlsContext,
        DocumentVersionService documentVersionService,
        DocumentAccessLogService accessLogService
    ) {
        this.storageClient = Objects.requireNonNull(storageClient);
        this.bucket = Objects.requireNonNull(bucket);
        this.patientService = Objects.requireNonNull(patientService);
        this.documentRepository = Objects.requireNonNull(documentRepository);
        this.tenantRlsContext = Objects.requireNonNull(tenantRlsContext);
        this.documentVersionService = Objects.requireNonNull(documentVersionService);
        this.accessLogService = Objects.requireNonNull(accessLogService);
    }

    @Transactional
    public PatientDocumentResponse upload(
        UUID patientId,
        MultipartFile file,
        String actorId,
        String correlationId
    ) throws IOException {
        patientService.get(patientId);
        if (file.isEmpty() || file.getSize() > MAX_DOCUMENT_BYTES) {
            throw new ValidationException("Document must be non-empty and no larger than 10 MiB");
        }

        UUID tenantId = tenantRlsContext.apply();
        UUID documentId = UUID.randomUUID();
        String fileName = cleanFileName(file.getOriginalFilename());
        String contentType = file.getContentType() == null || file.getContentType().isBlank()
            ? DEFAULT_CONTENT_TYPE
            : file.getContentType();
        String objectKey = objectKey(tenantId, patientId, documentId);
        String mediaUrl = mediaUrl(patientId, documentId);
        byte[] content = file.getBytes();

        try {
            storageClient.upload(bucket, objectKey, contentType, content);
            PatientDocument document = documentRepository.saveAndFlush(new PatientDocument(
                documentId,
                patientId,
                fileName,
                contentType,
                file.getSize(),
                mediaUrl,
                Instant.now()
            ));
            documentVersionService.recordInitialVersion(
                tenantId, patientId, documentId, fileName, contentType, content, actorId
            );
            accessLogService.record(tenantId, patientId, documentId, actorId, "UPLOAD", correlationId);
            return toResponse(document);
        } catch (RuntimeException persistenceFailure) {
            try {
                storageClient.delete(bucket, objectKey);
            } catch (RuntimeException cleanupFailure) {
                persistenceFailure.addSuppressed(cleanupFailure);
            }
            throw persistenceFailure;
        }
    }

    @Transactional
    public List<PatientDocumentResponse> list(UUID patientId, String actorId, String correlationId) {
        patientService.get(patientId);
        UUID tenantId = tenantRlsContext.apply();
        List<PatientDocument> documents = documentRepository
            .findAllByTenantIdAndPatientIdOrderByUploadedAtDesc(tenantId, patientId);
        accessLogService.record(tenantId, patientId, null, actorId, "LIST", correlationId);
        return documents
            .stream()
            .map(PatientDocumentStorageService::toResponse)
            .toList();
    }

    @Transactional
    public StoredDocument download(
        UUID patientId,
        UUID documentId,
        String actorId,
        String correlationId
    ) {
        patientService.get(patientId);
        UUID tenantId = tenantRlsContext.apply();
        PatientDocument document = findDocument(tenantId, patientId, documentId);
        SupabaseStorageClient.StoredObject storedObject = storageClient.download(
            bucket,
            objectKey(tenantId, patientId, documentId)
        );
        accessLogService.record(tenantId, patientId, documentId, actorId, "DOWNLOAD", correlationId);
        return new StoredDocument(
            storedObject.content(),
            safeContentType(document.getContentType()),
            document.getFileName()
        );
    }

    @Transactional
    public void delete(UUID patientId, UUID documentId, String actorId, String correlationId) {
        patientService.get(patientId);
        UUID tenantId = tenantRlsContext.apply();
        findDocument(tenantId, patientId, documentId);
        documentVersionService.deleteVersions(tenantId, patientId, documentId);
        storageClient.delete(bucket, objectKey(tenantId, patientId, documentId));
        documentRepository.deleteById(documentId);
        accessLogService.record(tenantId, patientId, documentId, actorId, "DELETE", correlationId);
    }

    private PatientDocument findDocument(UUID tenantId, UUID patientId, UUID documentId) {
        return documentRepository.findByIdAndTenantIdAndPatientId(documentId, tenantId, patientId)
            .orElseThrow(() -> new NotFoundException("Patient document not found"));
    }

    private static PatientDocumentResponse toResponse(PatientDocument document) {
        return new PatientDocumentResponse(
            document.getId(),
            document.getFileName(),
            document.getContentType(),
            document.getSizeBytes(),
            document.getUploadedAt(),
            document.getMediaUrl()
        );
    }

    private static String objectKey(UUID tenantId, UUID patientId, UUID documentId) {
        return tenantId + "/patients/" + patientId + "/documents/" + documentId;
    }

    private static String mediaUrl(UUID patientId, UUID documentId) {
        return "/api/v1/patients/" + patientId + "/documents/" + documentId + "/content";
    }

    private static String safeContentType(String contentType) {
        if ("application/pdf".equalsIgnoreCase(contentType)
            || "image/jpeg".equalsIgnoreCase(contentType)
            || "image/png".equalsIgnoreCase(contentType)
            || "image/gif".equalsIgnoreCase(contentType)
            || "image/webp".equalsIgnoreCase(contentType)
            || "image/avif".equalsIgnoreCase(contentType)) {
            return contentType;
        }
        return DEFAULT_CONTENT_TYPE;
    }

    private static String cleanFileName(String fileName) {
        String normalized = fileName == null ? "document" : fileName.replace('\\', '/');
        int lastSeparator = normalized.lastIndexOf('/');
        String cleanName = normalized.substring(lastSeparator + 1)
            .replaceAll("[\\p{Cntrl}]", "_")
            .trim();
        if (cleanName.isBlank()) {
            return "document";
        }
        return cleanName.length() <= MAX_FILE_NAME_LENGTH
            ? cleanName
            : cleanName.substring(cleanName.length() - MAX_FILE_NAME_LENGTH);
    }

    public record StoredDocument(byte[] content, String contentType, String fileName) { }
}
