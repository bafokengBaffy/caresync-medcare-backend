package health.caresync.patient.controller;

import health.caresync.patient.service.AdminIntegrationService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/integrations")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminIntegrationController {
    private final AdminIntegrationService integrations;

    public AdminIntegrationController(AdminIntegrationService integrations) {
        this.integrations = integrations;
    }

    @GetMapping("/status")
    public List<AdminIntegrationService.IntegrationStatus> status() {
        return integrations.getStatuses();
    }

    @PostMapping("/{id}/test")
    public AdminIntegrationService.IntegrationStatus test(@PathVariable String id) {
        return integrations.test(id);
    }
}
