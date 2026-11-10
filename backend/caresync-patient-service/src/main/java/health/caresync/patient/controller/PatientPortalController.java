package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.dto.portal.PatientAppointmentItem;
import health.caresync.patient.dto.portal.PatientInvoiceItem;
import health.caresync.patient.dto.portal.PatientPortalProfile;
import health.caresync.patient.dto.portal.PatientRecordItem;
import health.caresync.patient.service.PatientPortalService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patient/me")
@PreAuthorize("hasRole('PATIENT')")
public class PatientPortalController {
    private final PatientPortalService portalService;

    public PatientPortalController(PatientPortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping
    public PatientPortalProfile profile(@AuthenticationPrincipal CaresyncPrincipal actor) {
        return portalService.profile(actor);
    }

    @GetMapping("/appointments")
    public List<PatientAppointmentItem> appointments(@AuthenticationPrincipal CaresyncPrincipal actor) {
        return portalService.appointments(actor);
    }

    @GetMapping("/invoices")
    public List<PatientInvoiceItem> invoices(@AuthenticationPrincipal CaresyncPrincipal actor) {
        return portalService.invoices(actor);
    }

    @GetMapping("/records")
    public List<PatientRecordItem> records(@AuthenticationPrincipal CaresyncPrincipal actor) {
        return portalService.records(actor);
    }
}
