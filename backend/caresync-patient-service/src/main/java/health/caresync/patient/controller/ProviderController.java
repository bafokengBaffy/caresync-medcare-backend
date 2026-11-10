package health.caresync.patient.controller;

import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.ProviderResponse;
import health.caresync.patient.service.ProviderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Provider operations.
 */
@RestController
@RequestMapping("/api/v1/providers")
public class ProviderController {

    private final ProviderService providerService;

    public ProviderController(ProviderService providerService) {
        this.providerService = providerService;
    }

    @GetMapping
    @RequirePermission("providers:read")
    public ResponseEntity<ApiResponse<List<ProviderResponse>>> getAllProviders() {
        List<ProviderResponse> providers = providerService.getAllProviders();
        return ResponseEntity.ok(ApiResponse.success(providers));
    }

    @GetMapping("/{id}")
    @RequirePermission("providers:read")
    public ResponseEntity<ApiResponse<ProviderResponse>> getProviderById(@PathVariable UUID id) {
        ProviderResponse provider = providerService.getProviderById(id);
        return ResponseEntity.ok(ApiResponse.success(provider));
    }
}
