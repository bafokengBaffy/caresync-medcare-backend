package health.caresync.patient.controller;

import health.caresync.common.annotation.AuditLog;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.service.AdminIntegrationConsoleService;
import health.caresync.patient.service.AdminIntegrationConsoleService.IntegrationDescriptor;
import health.caresync.patient.service.AdminIntegrationConsoleService.IntegrationEvent;
import health.caresync.patient.service.AdminIntegrationConsoleService.Readiness;
import health.caresync.patient.service.AdminIntegrationConsoleService.StatusReport;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/integrations")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminIntegrationController {
    private final AdminIntegrationConsoleService integrations;

    public AdminIntegrationController(AdminIntegrationConsoleService integrations) {
        this.integrations = integrations;
    }

    @GetMapping
    public List<IntegrationDescriptor> list(@RequestParam(required = false) String search,
        @RequestParam(required = false) String category, @RequestParam(required = false) String environment) {
        return integrations.list(search, category, environment);
    }

    @GetMapping("/status")
    public List<StatusReport> statuses(@RequestParam(required = false) String ids) { return integrations.statuses(ids); }

    @GetMapping("/{id}/status")
    public StatusReport status(@PathVariable String id) { return integrations.status(id); }

    @GetMapping("/{id}/readiness")
    public List<Readiness> readiness(@PathVariable String id) { return integrations.readiness(id); }

    @GetMapping("/{id}/events")
    public List<IntegrationEvent> events(@PathVariable String id) { return integrations.events(id); }

    @PostMapping("/{id}/probe")
    @AuditLog(action = "ADMIN_INTEGRATION_PROBE", description = "Ran an allowlisted integration health check")
    public StatusReport probe(@PathVariable String id, @Valid @RequestBody ProbeRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor) {
        return integrations.probe(id, request.checkId(), request.reason(), actor.userId(), actor.email());
    }

    @PostMapping("/{id}/rotations")
    @AuditLog(action = "ADMIN_INTEGRATION_ROTATION", description = "Recorded credential rotation metadata")
    public StatusReport rotation(@PathVariable String id, @Valid @RequestBody RotationRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor) {
        return integrations.rotation(id, request.environment(), request.keysRotated(), request.reason(), request.rotationTicketRef(), actor.userId(), actor.email());
    }

    @PostMapping("/{id}/verify")
    @AuditLog(action = "ADMIN_INTEGRATION_VERIFY", description = "Verified integration environment credential presence")
    public Readiness verify(@PathVariable String id, @Valid @RequestBody VerifyRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor) {
        return integrations.verify(id, request.environment(), request.reason(), actor.userId(), actor.email());
    }

    public record ProbeRequest(@NotBlank @Pattern(regexp = "[a-z0-9][a-z0-9-]{1,63}") String checkId,
        @NotBlank @Size(min = 3, max = 500) String reason) { }
    public record RotationRequest(@NotBlank String environment, @NotEmpty @Size(max = 20) List<@NotBlank @Size(max = 128) String> keysRotated,
        @NotBlank @Size(min = 3, max = 500) String reason, @Size(max = 31) String rotationTicketRef) { }
    public record VerifyRequest(@NotBlank String environment, @NotBlank @Size(min = 3, max = 500) String reason) { }
}
