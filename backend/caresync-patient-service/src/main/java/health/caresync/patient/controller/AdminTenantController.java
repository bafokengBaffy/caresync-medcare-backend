package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.admin.AdminTenantDtos;
import health.caresync.patient.dto.admin.AdminUserResponse;
import health.caresync.patient.dto.admin.ProvisionUserRequest;
import health.caresync.patient.dto.admin.UpdateUserRoleRequest;
import health.caresync.patient.dto.admin.UpdateUserStatusRequest;
import health.caresync.patient.service.AdminUserService;
import health.caresync.common.web.PageResponse;
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
import org.springframework.web.bind.annotation.PutMapping;
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
    private final AdminUserService users;

    public AdminTenantController(AdminTenantService service, AdminUserService users) {
        this.service = service;
        this.users = users;
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

    @GetMapping("/{tenantId}/admins")
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> admins(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            users.list(actor, tenantId, "TENANT_ADMIN", null, null, page, size, "createdAt", "desc")
        ));
    }

    @PostMapping("/{tenantId}/admins")
    public ResponseEntity<ApiResponse<AdminUserResponse>> provisionAdmin(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId,
        @Valid @RequestBody ProvisionUserRequest request,
        HttpServletRequest servletRequest
    ) {
        ProvisionUserRequest scopedRequest = new ProvisionUserRequest(
            request.firebaseUid(), request.email(), "TENANT_ADMIN", tenantId, request.fullName(),
            request.phone(), request.specialty(), request.patientId(), request.permissions()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
            users.provision(actor, scopedRequest, servletRequest)
        ));
    }

    @PutMapping("/{tenantId}/admins/{firebaseUid}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateAdminRole(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId,
        @PathVariable String firebaseUid,
        @Valid @RequestBody UpdateUserRoleRequest request,
        HttpServletRequest servletRequest
    ) {
        UpdateUserRoleRequest scopedRequest = new UpdateUserRoleRequest(
            request.role(), tenantId, request.specialty(), request.patientId(), request.permissions()
        );
        return ResponseEntity.ok(ApiResponse.ok(
            users.updateRole(actor, firebaseUid, scopedRequest, servletRequest)
        ));
    }

    @PatchMapping("/{tenantId}/admins/{firebaseUid}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateAdminStatus(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId,
        @PathVariable String firebaseUid,
        @Valid @RequestBody UpdateUserStatusRequest request,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            users.updateStatus(actor, firebaseUid, request.status(), tenantId, servletRequest)
        ));
    }

    @DeleteMapping("/{tenantId}/admins/{firebaseUid}")
    public ResponseEntity<Void> deleteAdmin(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable UUID tenantId,
        @PathVariable String firebaseUid,
        HttpServletRequest servletRequest
    ) {
        users.softDelete(actor, firebaseUid, tenantId, servletRequest);
        return ResponseEntity.noContent().build();
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
