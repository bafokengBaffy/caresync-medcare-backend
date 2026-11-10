package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.admin.RegistrationRequestResponse;
import health.caresync.patient.dto.admin.RejectRegistrationRequest;
import health.caresync.patient.dto.admin.ReviewRegistrationRequest;
import health.caresync.patient.service.AdminRegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/registration")
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
public class AdminRegistrationController {
    private final AdminRegistrationService registrationService;

    public AdminRegistrationController(AdminRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<PageResponse<RegistrationRequestResponse>>> list(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestParam(required = false) UUID tenantId,
        @RequestParam(defaultValue = "PENDING") String status,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            registrationService.list(actor, tenantId, status, search, page, size)
        ));
    }

    @PostMapping("/requests/{requestId}/approve")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> approve(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID requestId,
        @Valid @RequestBody ReviewRegistrationRequest request,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(registrationService.approve(
            actor, requestId, request.tenantId(), request.patientId(), servletRequest
        )));
    }

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> reject(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID requestId,
        @Valid @RequestBody RejectRegistrationRequest request,
        @RequestParam(required = false) UUID tenantId,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(registrationService.reject(
            actor, requestId, tenantId, request.reason(), servletRequest
        )));
    }

    @GetMapping("/pending-activations")
    public ResponseEntity<ApiResponse<PageResponse<AdminRegistrationService.PendingActivationResponse>>>
        pendingActivations(
            @AuthenticationPrincipal CaresyncPrincipal actor,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
        ) {
        return ResponseEntity.ok(ApiResponse.ok(
            registrationService.pendingActivations(actor, tenantId, page, size)
        ));
    }
}
