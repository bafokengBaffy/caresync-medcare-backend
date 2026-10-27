package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.PatientDocumentVersion;
import health.caresync.patient.dto.PatientDocumentVersionResponse;
import health.caresync.patient.mapper.PatientDocumentVersionMapper;
import health.caresync.patient.storage.DocumentVersionService;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
public class PatientDocumentVersionService {
    private static final long MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
    private final PatientService patientService;
    private final DocumentVersionService documentVersionService;
    private final PatientDocumentVersionMapper versionMapper;
    private final TenantRlsContext tenantRlsContext;

    public PatientDocumentVersionService(
        PatientService patientService,
        DocumentVersionService documentVersionService,
        PatientDocumentVersionMapper versionMapper,
        TenantRlsContext tenantRlsContext
    ) {
        this.patientService = patientService;
        this.documentVersionService = documentVersionService;
        this.versionMapper = versionMapper;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public List<PatientDocumentVersionResponse> list(UUID tenantId, UUID patientId, UUID documentId) {
        requireTenantAndPatient(tenantId, patientId);
        return documentVersionService.list(tenantId, patientId, documentId).stream()
            .map(versionMapper::toResponse)
            .toList();
    }

    @Transactional
    public PatientDocumentVersionResponse create(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        MultipartFile file,
        String actorId
    ) throws IOException {
        requireTenantAndPatient(tenantId, patientId);
        validateFile(file);
        PatientDocumentVersion version = documentVersionService.createVersion(
            tenantId,
            patientId,
            documentId,
            cleanFileName(file.getOriginalFilename()),
            contentType(file.getContentType()),
            file.getBytes(),
            actorId
        );
        return versionMapper.toResponse(version);
    }

    @Transactional
    public PatientDocumentVersionResponse restore(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        int versionNumber,
        String actorId
    ) {
        requireTenantAndPatient(tenantId, patientId);
        if (versionNumber < 1) {
            throw new ValidationException("Version number must be positive");
        }
        return versionMapper.toResponse(documentVersionService.restore(
            tenantId, patientId, documentId, versionNumber, actorId
        ));
    }

    private void requireTenantAndPatient(UUID tenantId, UUID patientId) {
        if (!Objects.equals(tenantId, tenantRlsContext.apply())) {
            throw new ForbiddenException("Tenant access denied");
        }
        patientService.get(patientId);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_DOCUMENT_BYTES) {
            throw new ValidationException("Document must be non-empty and no larger than 10 MiB");
        }
    }

    private String contentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        try {
            return MediaType.parseMediaType(contentType).toString();
        } catch (org.springframework.http.InvalidMediaTypeException exception) {
            throw new ValidationException("Document content type is invalid");
        }
    }

    private String cleanFileName(String fileName) {
        String normalized = fileName == null ? "document" : fileName.replace('\\', '/');
        int lastSeparator = normalized.lastIndexOf('/');
        String cleanName = normalized.substring(lastSeparator + 1)
            .replaceAll("[\\p{Cntrl}]", "_")
            .trim();
        if (cleanName.isBlank()) {
            return "document";
        }
        return cleanName.length() <= 255 ? cleanName : cleanName.substring(cleanName.length() - 255);
    }
}