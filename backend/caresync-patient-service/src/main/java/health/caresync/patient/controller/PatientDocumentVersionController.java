package health.caresync.patient.controller;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.PatientDocumentVersionResponse;
import health.caresync.patient.service.PatientDocumentVersionService;
import health.caresync.patient.storage.DocumentAccessLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
@RequestMapping("/api/v1/tenants/{tenantId}/patients/{patientId}/documents/{documentId}/versions")
public class PatientDocumentVersionController {
    private final PatientDocumentVersionService versionService;
    private final DocumentAccessLogService accessLogService;

    public PatientDocumentVersionController(
        PatientDocumentVersionService versionService,
        DocumentAccessLogService accessLogService
    ) {
        this.versionService = versionService;
        this.accessLogService = accessLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION','RECEPTIONIST','STAFF','PROVIDER','CLINICIAN','MANAGER') "
        + "or hasAuthority('PATIENT_DOCUMENT_READ')")
    public ResponseEntity<ApiResponse<List<PatientDocumentVersionResponse>>> list(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID documentId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        List<PatientDocumentVersionResponse> versions = versionService.list(tenantId, patientId, documentId);
        accessLogService.record(
            tenantId, patientId, documentId, principal.userId(), "LIST", correlationId(servletRequest)
        );
        return ok(versions, servletRequest);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION','RECEPTIONIST','STAFF','PROVIDER','CLINICIAN') "
        + "or hasAuthority('PATIENT_DOCUMENT_WRITE')")
    public ResponseEntity<ApiResponse<PatientDocumentVersionResponse>> create(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID documentId,
        @RequestPart("file") MultipartFile file,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) throws IOException {
        requireTenant(tenantId, principal);
        PatientDocumentVersionResponse version = versionService.create(
            tenantId, patientId, documentId, file, principal.userId()
        );
        accessLogService.record(
            tenantId, patientId, documentId, principal.userId(), "UPLOAD", correlationId(servletRequest)
        );
        return ok(
            version,
            servletRequest
        );
    }

    @PostMapping("/{versionNumber}/restore")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('PATIENT_DOCUMENT_RESTORE')")
    public ResponseEntity<ApiResponse<PatientDocumentVersionResponse>> restore(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID documentId,
        @PathVariable int versionNumber,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        PatientDocumentVersionResponse version = versionService.restore(
            tenantId, patientId, documentId, versionNumber, principal.userId()
        );
        accessLogService.record(
            tenantId, patientId, documentId, principal.userId(), "RESTORE", correlationId(servletRequest)
        );
        return ok(
            version,
            servletRequest
        );
    }

    private void requireTenant(UUID tenantId, CaresyncPrincipal principal) {
        if (principal == null || !Objects.equals(principal.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
    }

    private <T> ResponseEntity<ApiResponse<T>> ok(T body, HttpServletRequest request) {
        return ResponseEntity.ok()
            .header("X-Correlation-Id", correlationId(request))
            .body(ApiResponse.ok(body));
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
}