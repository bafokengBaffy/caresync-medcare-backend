package health.caresync.clinical.controller;

import health.caresync.clinical.dto.AppointmentCreateRequest;
import health.caresync.clinical.dto.AppointmentResponse;
import health.caresync.clinical.dto.AppointmentStatusRequest;
import health.caresync.clinical.service.AppointmentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {
    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public AppointmentResponse create(@Valid @RequestBody AppointmentCreateRequest request) {
        return appointmentService.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public AppointmentResponse get(@PathVariable UUID id) {
        return appointmentService.get(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public List<AppointmentResponse> list() {
        return appointmentService.list();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER')")
    public AppointmentResponse changeStatus(
        @PathVariable UUID id,
        @Valid @RequestBody AppointmentStatusRequest request
    ) {
        return appointmentService.changeStatus(id, request);
    }
}
