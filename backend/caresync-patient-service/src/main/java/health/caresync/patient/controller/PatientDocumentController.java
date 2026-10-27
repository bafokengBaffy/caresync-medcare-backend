package health.caresync.patient.controller;

import health.caresync.patient.storage.PatientDocumentStorageService;
import health.caresync.patient.dto.PatientDocumentResponse;
import health.caresync.common.security.CaresyncPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public List<PatientDocumentResponse> list(
        @PathVariable UUID patientId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest request
    ) {
        return storageService.list(patientId, principal.userId(), correlationId(request));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER')")
    public DocumentUploadResponse upload(
        @PathVariable UUID patientId,
        @RequestPart("file") @NotNull MultipartFile file,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest request
    ) throws IOException {
        return new DocumentUploadResponse(
            storageService.upload(patientId, file, principal.userId(), correlationId(request))
        );
    }

    @GetMapping("/{documentId}/content")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public ResponseEntity<byte[]> download(
        @PathVariable UUID patientId,
        @PathVariable UUID documentId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest request
    ) {
        PatientDocumentStorageService.StoredDocument document = storageService.download(
            patientId, documentId, principal.userId(), correlationId(request)
        );
        MediaType contentType = document.contentType() == null
            ? MediaType.APPLICATION_OCTET_STREAM
            : MediaType.parseMediaType(document.contentType());
        return ResponseEntity.ok()
            .contentType(contentType)
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .header("X-Content-Type-Options", "nosniff")
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename(document.fileName())
                .build()
                .toString())
            .body(document.content());
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public ResponseEntity<Void> delete(
        @PathVariable UUID patientId,
        @PathVariable UUID documentId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest request
    ) {
        storageService.delete(patientId, documentId, principal.userId(), correlationId(request));
        return ResponseEntity.noContent().build();
    }

    private String correlationId(HttpServletRequest request) {
        Object value = request.getAttribute("correlationId");
        if (value instanceof String id && id.matches("[A-Za-z0-9._-]{1,128}")) {
            return id;
        }
        String header = request.getHeader("X-Correlation-Id");
        if (header != null && header.matches("[A-Za-z0-9._-]{1,128}")) {
            request.setAttribute("correlationId", header);
            return header;
        }
        String id = UUID.randomUUID().toString();
        request.setAttribute("correlationId", id);
        return id;
    }

    public record DocumentUploadResponse(PatientDocumentResponse document) { }
}
