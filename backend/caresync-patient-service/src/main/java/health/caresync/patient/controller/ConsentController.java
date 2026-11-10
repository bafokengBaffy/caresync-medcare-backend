package health.caresync.patient.controller;

import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.security.TenantContext;
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
import java.util.Optional;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/patients/{patientId}/consents")
public class ConsentController {
    private final ConsentService consentService;

    public ConsentController(ConsentService consentService) {
        this.consentService = consentService;
    }

    @PostMapping
    @RequirePermission("consents:write")
    @AuditLog(action = "CREATE_CONSENT")
    public ResponseEntity<ApiResponse<ConsentResponse>> createConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @Valid @RequestBody ConsentCreateRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        HttpServletRequest servletRequest
    ) {
        requireTenantAccess(tenantId, actor);
        String correlationId = correlationId(servletRequest);
        ConsentResponse response = consentService.createConsent(
            tenantId, patientId, request, actor.userId(), idempotencyKey, correlationId
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .header("X-Correlation-Id", correlationId)
            .body(ApiResponse.ok(response));
    }

    @GetMapping
    @RequirePermission("consents:read")
    @AuditLog(action = "READ_CONSENTS")
    public ResponseEntity<ApiResponse<PageResponse<ConsentResponse>>> listConsents(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String sort,
        @RequestParam(required = false) String consentType,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        requireTenantAccess(tenantId, actor);
        return ResponseEntity.ok(ApiResponse.ok(consentService.listConsents(
            tenantId, patientId, page, size, sort, consentType, status, from, to
        )));
    }

    @GetMapping("/{consentId}")
    @RequirePermission("consents:read")
    @AuditLog(action = "READ_CONSENT")
    public ResponseEntity<ApiResponse<ConsentResponse>> getConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        requireTenantAccess(tenantId, actor);
        return ResponseEntity.ok(ApiResponse.ok(consentService.getConsent(tenantId, patientId, consentId)));
    }

    @PatchMapping("/{consentId}")
    @RequirePermission("consents:write")
    @AuditLog(action = "UPDATE_CONSENT")
    public ResponseEntity<ApiResponse<ConsentResponse>> updateConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @Valid @RequestBody ConsentUpdateRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor,
        HttpServletRequest servletRequest
    ) {
        requireTenantAccess(tenantId, actor);
        ConsentResponse response = consentService.updateConsent(
            tenantId, patientId, consentId, request, actor.userId(), correlationId(servletRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{consentId}/revoke")
    @RequirePermission("consents:write")
    @AuditLog(action = "REVOKE_CONSENT")
    public ResponseEntity<ApiResponse<ConsentResponse>> revokeConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @Valid @RequestBody ConsentRevokeRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor,
        HttpServletRequest servletRequest
    ) {
        requireTenantAccess(tenantId, actor);
        ConsentResponse response = consentService.revokeConsent(
            tenantId, patientId, consentId, request.reason(), actor.userId(), correlationId(servletRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{consentId}/history")
    @RequirePermission("consents:read")
    @AuditLog(action = "READ_CONSENT_HISTORY")
    public ResponseEntity<ApiResponse<List<ConsentHistoryResponse>>> getConsentHistory(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @PathVariable UUID consentId,
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        requireTenantAccess(tenantId, actor);
        return ResponseEntity.ok(ApiResponse.ok(
            consentService.getConsentHistory(tenantId, patientId, consentId)
        ));
    }

    @GetMapping("/active")
    @RequirePermission("consents:read")
    public ResponseEntity<ApiResponse<ConsentResponse>> findActiveConsent(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestParam String consentType
    ) {
        requireTenantAccess(tenantId, actor);
        Optional<ConsentResponse> response =
            consentService.findActiveConsent(tenantId, patientId, consentType);
        return response.map(value -> ResponseEntity.ok(ApiResponse.ok(value)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Active consent not found")));
    }

    private static void requireTenantAccess(UUID tenantId, CaresyncPrincipal actor) {
        if (actor == null || tenantId == null) {
            throw new ForbiddenException("Tenant access denied");
        }
        if ("SUPER_ADMIN".equals(actor.role())) {
            if (!tenantId.equals(TenantContext.require())) {
                throw new ForbiddenException("Select the requested tenant before accessing its data");
            }
        } else if (!tenantId.equals(actor.tenantId())) {
            throw new ForbiddenException("Tenant access denied");
        }
    }

    private static String correlationId(HttpServletRequest request) {
        String value = request == null ? null : request.getHeader("X-Correlation-Id");
        return value != null && value.matches("[A-Za-z0-9._-]{1,128}") ? value : null;
    }
}
