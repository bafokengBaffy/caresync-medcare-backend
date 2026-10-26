package health.caresync.patient.controller;

import health.caresync.common.web.PageResponse;
import health.caresync.common.exception.ValidationException;
import health.caresync.patient.dto.ProviderCreateRequest;
import health.caresync.patient.dto.ProviderResponse;
import health.caresync.patient.dto.ProviderSummaryResponse;
import health.caresync.patient.dto.ProviderUpdateRequest;
import health.caresync.patient.service.ProviderService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/providers")
public class ProviderController {
    private final ProviderService providerService;

    public ProviderController(ProviderService providerService) {
        this.providerService = providerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public PageResponse<ProviderSummaryResponse> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String specialty,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Boolean active = switch (status == null ? "" : status.toUpperCase()) {
            case "", "ALL" -> null;
            case "ACTIVE" -> true;
            case "INACTIVE" -> false;
            default -> throw new ValidationException("Status must be ACTIVE or INACTIVE");
        };
        return providerService.list(search, specialty, active, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public ProviderResponse create(@Valid @RequestBody ProviderCreateRequest request) {
        return providerService.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public ProviderResponse get(@PathVariable UUID id) {
        return providerService.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public ProviderResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody ProviderUpdateRequest request
    ) {
        return providerService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public void deactivate(@PathVariable UUID id) {
        providerService.deactivate(id);
    }
}
