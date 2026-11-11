package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.admin.AdminUserResponse;
import health.caresync.patient.dto.admin.ProvisionUserRequest;
import health.caresync.patient.dto.admin.UpdateUserRoleRequest;
import health.caresync.patient.dto.admin.UpdateUserStatusRequest;
import health.caresync.patient.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/v1/tenant/users")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class TenantUserController {
    private final AdminUserService users;

    public TenantUserController(AdminUserService users) {
        this.users = users;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> list(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(users.list(
            actor, actor.tenantId(), role, status, search, page, size, "createdAt", "desc"
        )));
    }

    @GetMapping("/{firebaseUid}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> get(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid
    ) {
        return ResponseEntity.ok(ApiResponse.ok(users.get(actor, firebaseUid, actor.tenantId())));
    }

    @PostMapping("/provision")
    public ResponseEntity<ApiResponse<AdminUserResponse>> provision(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @Valid @RequestBody ProvisionUserRequest request,
        HttpServletRequest servletRequest
    ) {
        ProvisionUserRequest tenantScopedRequest = new ProvisionUserRequest(
            request.firebaseUid(), request.email(), request.role(), actor.tenantId(), request.fullName(),
            request.phone(), request.specialty(), request.patientId(), request.permissions()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
            users.provision(actor, tenantScopedRequest, servletRequest)
        ));
    }

    @org.springframework.web.bind.annotation.RequestMapping(
        path = "/{firebaseUid}/role",
        method = {org.springframework.web.bind.annotation.RequestMethod.PUT,
            org.springframework.web.bind.annotation.RequestMethod.PATCH}
    )
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateRole(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid,
        @Valid @RequestBody UpdateUserRoleRequest request,
        HttpServletRequest servletRequest
    ) {
        UpdateUserRoleRequest tenantScopedRequest = new UpdateUserRoleRequest(
            request.role(), actor.tenantId(), request.specialty(), request.patientId(), request.permissions()
        );
        return ResponseEntity.ok(ApiResponse.ok(
            users.updateRole(actor, firebaseUid, tenantScopedRequest, servletRequest)
        ));
    }

    @PatchMapping("/{firebaseUid}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateStatus(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid,
        @Valid @RequestBody UpdateUserStatusRequest request,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            users.updateStatus(actor, firebaseUid, request.status(), actor.tenantId(), servletRequest)
        ));
    }

    @DeleteMapping("/{firebaseUid}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid,
        HttpServletRequest servletRequest
    ) {
        users.softDelete(actor, firebaseUid, actor.tenantId(), servletRequest);
        return ResponseEntity.noContent().build();
    }
}
