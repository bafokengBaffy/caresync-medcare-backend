package health.caresync.clinical.controller;

import health.caresync.clinical.dto.AnonymousOnlineBookingRequest;
import health.caresync.clinical.dto.AppointmentResponse;
import health.caresync.clinical.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/clinics/{tenantSlug}/appointments")
public class PublicAppointmentBookingController {
    private final AppointmentService appointmentService;

    public PublicAppointmentBookingController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse create(
        @PathVariable String tenantSlug,
        @Valid @RequestBody AnonymousOnlineBookingRequest request
    ) {
        return appointmentService.createAnonymousOnlineBooking(tenantSlug, request);
    }
}
