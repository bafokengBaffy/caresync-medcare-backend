package health.caresync.patient.controller;

import health.caresync.patient.storage.PatientDocumentStorageService;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/documents")
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
public class PatientDocumentController {
    private final PatientDocumentStorageService storageService;

    public PatientDocumentController(PatientDocumentStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER')")
    public DocumentUploadResponse upload(
        @PathVariable UUID patientId,
        @RequestPart("file") @NotNull MultipartFile file
    ) throws IOException {
        UUID objectId = storageService.upload(patientId, file);
        return new DocumentUploadResponse(objectId, file.getSize());
    }

    @GetMapping("/{objectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public ResponseEntity<byte[]> download(
        @PathVariable UUID patientId,
        @PathVariable UUID objectId
    ) throws IOException {
        PatientDocumentStorageService.StoredDocument document = storageService.download(patientId, objectId);
        MediaType contentType = document.contentType() == null
            ? MediaType.APPLICATION_OCTET_STREAM
            : MediaType.parseMediaType(document.contentType());
        return ResponseEntity.ok()
            .contentType(contentType)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename("patient-document-" + objectId)
                .build()
                .toString())
            .body(document.content());
    }

    public record DocumentUploadResponse(UUID objectId, long sizeBytes) { }
}
