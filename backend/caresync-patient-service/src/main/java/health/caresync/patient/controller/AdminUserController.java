package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.admin.AdminUserResponse;
import health.caresync.patient.dto.admin.FirebaseAccountLookupResponse;
import health.caresync.patient.dto.admin.ProvisionUserRequest;
import health.caresync.patient.dto.admin.UpdateUserRoleRequest;
import health.caresync.patient.dto.admin.UpdateUserStatusRequest;
import health.caresync.patient.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/admin/users")
@Validated
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/firebase-account")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<FirebaseAccountLookupResponse>> lookupFirebaseAccount(
        @RequestParam @NotBlank @Email String email
    ) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.lookupFirebaseAccount(email)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> list(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestParam(required = false) UUID tenantId,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt") String sort,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.list(
            actor, tenantId, role, status, search, page, size, sort, direction
        )));
    }

    @GetMapping("/{firebaseUid}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> get(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid,
        @RequestParam(required = false) UUID tenantId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.get(actor, firebaseUid, tenantId)));
    }

    @PostMapping("/provision")
    public ResponseEntity<ApiResponse<AdminUserResponse>> provision(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @Valid @RequestBody ProvisionUserRequest request,
        HttpServletRequest servletRequest
    ) {
        AdminUserResponse user = adminUserService.provision(actor, request, servletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(user));
    }

    @PatchMapping("/{firebaseUid}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateRole(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid,
        @Valid @RequestBody UpdateUserRoleRequest request,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            adminUserService.updateRole(actor, firebaseUid, request, servletRequest)
        ));
    }

    @PatchMapping("/{firebaseUid}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateStatus(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid,
        @Valid @RequestBody UpdateUserStatusRequest request,
        @RequestParam(required = false) UUID tenantId,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            adminUserService.updateStatus(actor, firebaseUid, request.status(), tenantId, servletRequest)
        ));
    }

    @DeleteMapping("/{firebaseUid}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String firebaseUid,
        @RequestParam(required = false) UUID tenantId,
        HttpServletRequest servletRequest
    ) {
        adminUserService.softDelete(actor, firebaseUid, tenantId, servletRequest);
        return ResponseEntity.noContent().build();
    }
}
