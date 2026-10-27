package health.caresync.patient.controller;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.PatientPreferenceRequest;
import health.caresync.patient.dto.PatientPreferenceResponse;
import health.caresync.patient.service.PatientPreferenceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/patients/{patientId}/preferences")
public class PatientPreferenceController {
    private final PatientPreferenceService preferenceService;

    public PatientPreferenceController(PatientPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION','RECEPTIONIST','STAFF','PROVIDER','CLINICIAN','MANAGER') "
        + "or hasAuthority('PATIENT_READ')")
    public ResponseEntity<ApiResponse<PatientPreferenceResponse>> get(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        return ok(preferenceService.get(tenantId, patientId), servletRequest);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION','RECEPTIONIST','STAFF','MANAGER') "
        + "or hasAuthority('PATIENT_PREFERENCES_WRITE')")
    public ResponseEntity<ApiResponse<PatientPreferenceResponse>> update(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @Valid @RequestBody PatientPreferenceRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        return ok(
            preferenceService.update(tenantId, patientId, request, principal.userId()),
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