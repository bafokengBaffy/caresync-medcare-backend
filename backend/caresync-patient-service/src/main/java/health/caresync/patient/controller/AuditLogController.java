package health.caresync.patient.controller;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.AuditLogResponse;
import health.caresync.patient.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/audit-logs")
public class AuditLogController {
    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PRIVACY_OFFICER') or hasAuthority('AUDIT_READ')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> list(
        @PathVariable UUID tenantId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        if (principal == null || !Objects.equals(principal.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        String correlationId = correlationId(servletRequest);
        PageResponse<AuditLogResponse> result = auditLogService.list(tenantId, page, size);
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