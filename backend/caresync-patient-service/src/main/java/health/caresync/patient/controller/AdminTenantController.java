package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.admin.AdminTenantDtos;
import health.caresync.patient.service.AdminTenantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/tenants")
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminTenantController {
    private final AdminTenantService service;

    public AdminTenantController(AdminTenantService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<AdminTenantDtos.Page>> list(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String plan,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(actor, search, status, plan, page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminTenantDtos.Detail>> create(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @Valid @RequestBody AdminTenantDtos.CreateRequest request,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(service.create(actor, request, servletRequest)));
    }

    @GetMapping("/{tenantId}")
    public ResponseEntity<ApiResponse<AdminTenantDtos.Detail>> get(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(service.get(actor, tenantId)));
    }

    @PatchMapping("/{tenantId}/status")
    public ResponseEntity<ApiResponse<AdminTenantDtos.Detail>> updateStatus(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId,
        @Valid @RequestBody AdminTenantDtos.StatusRequest request,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            service.updateStatus(actor, tenantId, request.status(), servletRequest)
        ));
    }

    @GetMapping("/{tenantId}/providers")
    public ResponseEntity<ApiResponse<java.util.List<AdminTenantDtos.Provider>>> providers(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(service.listProviders(actor, tenantId)));
    }

    @DeleteMapping("/{tenantId}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId
    ) {
        service.rejectDeletion(actor, tenantId);
        return ResponseEntity.noContent().build();
    }
}
