package health.caresync.patient.controller;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.BulkOperationResponse;
import health.caresync.patient.dto.ConsentCreateRequest;
import health.caresync.patient.dto.ConsentHistoryResponse;
import health.caresync.patient.dto.ConsentResponse;
import health.caresync.patient.dto.ConsentRevokeRequest;
import health.caresync.patient.dto.ConsentUpdateRequest;
import health.caresync.patient.service.ConsentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ConsentController {
    private static final String READ_ACCESS =
        "hasAuthority('CONSENT_READ') or hasAnyRole('ADMIN','PROVIDER','STAFF','RECEPTION','MANAGER',"
            + "'CONSENT_MANAGER','CLINICIAN','PRIVACY_OFFICER','RECEPTIONIST')";
    private static final String WRITE_ACCESS =
        "hasAnyAuthority('CONSENT_WRITE','CONSENT_ADMIN') or hasAnyRole('ADMIN','MANAGER',"
            + "'CONSENT_MANAGER','CLINICIAN','PRIVACY_OFFICER')";

    private final ConsentService consentService;

    public ConsentController(ConsentService consentService) {
        this.consentService = consentService;
    }

    @PostMapping("/tenants/{tenantId}/patients/{patientId}/consents")
    @PreAuthorize(WRITE_ACCESS)
    public ResponseEntity<ApiResponse<ConsentResponse>> createConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @Valid @RequestBody ConsentCreateRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        String correlationId = correlationId(servletRequest);
        ConsentResponse response = consentService.createConsent(
            tenantId, patientId, request, principal.userId(), idempotencyKey, correlationId
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .header("X-Correlation-Id", correlationId)
            .body(ApiResponse.ok(response));
    }

    @GetMapping("/tenants/{tenantId}/patients/{patientId}/consents/{consentId}")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<ApiResponse<ConsentResponse>> getConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        ConsentResponse response = consentService.getConsent(tenantId, patientId, consentId);
        return ok(response, servletRequest);
    }

    @GetMapping("/tenants/{tenantId}/patients/{patientId}/consents")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<ApiResponse<PageResponse<ConsentResponse>>> listConsents(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String sort,
        @RequestParam(required = false) String consentType,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        PageResponse<ConsentResponse> response = consentService.listConsents(
            tenantId, patientId, page, size, sort, consentType, status, from, to
        );
        return ok(response, servletRequest);
    }

    @PutMapping("/tenants/{tenantId}/patients/{patientId}/consents/{consentId}")
    @PreAuthorize(WRITE_ACCESS)
    public ResponseEntity<ApiResponse<ConsentResponse>> updateConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @Valid @RequestBody ConsentUpdateRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        ConsentResponse response = consentService.updateConsent(
            tenantId, patientId, consentId, request, principal.userId(), correlationId(servletRequest)
        );
        return ok(response, servletRequest);
    }

    @PostMapping("/tenants/{tenantId}/patients/{patientId}/consents/{consentId}/revoke")
    @PreAuthorize(WRITE_ACCESS)
    public ResponseEntity<ApiResponse<ConsentResponse>> revokeConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @Valid @RequestBody ConsentRevokeRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        String correlationId = correlationId(servletRequest);
        ConsentResponse response = consentService.revokeConsent(
            tenantId, patientId, consentId, request.reason(), principal.userId(), correlationId
        );
        return ok(response, servletRequest);
    }

    @GetMapping("/tenants/{tenantId}/patients/{patientId}/consents/{consentId}/history")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<ApiResponse<List<ConsentHistoryResponse>>> getConsentHistory(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        List<ConsentHistoryResponse> response = consentService.getConsentHistory(
            tenantId, patientId, consentId
        );
        return ok(response, servletRequest);
    }

    @GetMapping("/tenants/{tenantId}/patients/{patientId}/consents/active")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<ApiResponse<ConsentResponse>> getActiveConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @RequestParam String consentType,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        ConsentResponse response = consentService.findActiveConsent(tenantId, patientId, consentType)
            .orElseThrow(() -> new NotFoundException("Active consent not found"));
        return ok(response, servletRequest);
    }

    @PostMapping("/tenants/{tenantId}/consents/bulk-expire")
    @PreAuthorize("hasAnyAuthority('CONSENT_ADMIN') or hasAnyRole('ADMIN','PRIVACY_OFFICER')")
    public ResponseEntity<ApiResponse<BulkOperationResponse>> bulkExpire(
        @PathVariable UUID tenantId,
        @RequestParam LocalDate asOf,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        String correlationId = correlationId(servletRequest);
        BulkOperationResponse response = consentService.expireConsents(
            tenantId, asOf, principal.userId(), correlationId
        );
        return ok(response, servletRequest);
    }

    private <T> ResponseEntity<ApiResponse<T>> ok(T body, HttpServletRequest request) {
        return ResponseEntity.ok()
            .header("X-Correlation-Id", correlationId(request))
            .body(ApiResponse.ok(body));
    }

    private void requireTenant(UUID tenantId, CaresyncPrincipal principal) {
        if (principal == null || !Objects.equals(principal.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
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
