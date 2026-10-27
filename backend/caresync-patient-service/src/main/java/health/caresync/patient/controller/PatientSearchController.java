package health.caresync.patient.controller;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.PatientSearchRequest;
import health.caresync.patient.dto.PatientSearchResponse;
import health.caresync.patient.service.PatientSearchService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/patients/search")
public class PatientSearchController {
    private final PatientSearchService patientSearchService;

    public PatientSearchController(PatientSearchService patientSearchService) {
        this.patientSearchService = patientSearchService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION','RECEPTIONIST','STAFF','PROVIDER','CLINICIAN','MANAGER') "
        + "or hasAuthority('PATIENT_READ')")
    public ResponseEntity<ApiResponse<PatientSearchResponse>> search(
        @PathVariable UUID tenantId,
        @Valid @RequestBody PatientSearchRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        if (principal == null || !Objects.equals(principal.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        String correlationId = correlationId(servletRequest);
        PatientSearchResponse result = patientSearchService.search(tenantId, request.toCriteria());
        return ResponseEntity.ok()
            .header("X-Correlation-Id", correlationId)
            .body(ApiResponse.ok(result));
    }

    private String correlationId(HttpServletRequest request) {
        Object value = request.getAttribute("correlationId");
        if (value instanceof String id && !id.isBlank()) {
            return id;
        }
        String header = request.getHeader("X-Correlation-Id");
        if (header != null && header.matches("[A-Za-z0-9._-]{1,128}")) {
            return header;
        }
        return UUID.randomUUID().toString();
    }
}