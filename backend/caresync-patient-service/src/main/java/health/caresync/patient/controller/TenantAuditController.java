package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.AuditLogResponse;
import health.caresync.patient.service.TenantAuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenant/audit")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class TenantAuditController {
    private final TenantAuditService auditService;

    public TenantAuditController(TenantAuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> list(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(auditService.list(actor, page, size)));
    }
}
