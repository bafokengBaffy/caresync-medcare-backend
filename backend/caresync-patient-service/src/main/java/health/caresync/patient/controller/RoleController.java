package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.admin.RoleConfigurationResponse;
import health.caresync.patient.dto.admin.UpdateRolePermissionsRequest;
import health.caresync.patient.service.AdminRoleService;
import jakarta.validation.Valid;
import java.util.List;
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
@RequestMapping("/api/v1/admin/roles")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class RoleController {
    private final AdminRoleService roles;

    public RoleController(AdminRoleService roles) {
        this.roles = roles;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleConfigurationResponse>>> list(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        return ResponseEntity.ok(ApiResponse.ok(roles.list(actor)));
    }

    @PutMapping("/{roleId}/permissions")
    public ResponseEntity<ApiResponse<RoleConfigurationResponse>> updatePermissions(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @PathVariable String roleId,
        @Valid @RequestBody UpdateRolePermissionsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(roles.update(actor, roleId, request)));
    }
}
