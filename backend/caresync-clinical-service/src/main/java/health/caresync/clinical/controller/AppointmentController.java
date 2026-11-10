package health.caresync.clinical.controller;
import health.caresync.clinical.dto.AppointmentResponse;
import health.caresync.clinical.dto.AppointmentRequest;
import health.caresync.clinical.service.AppointmentService;
import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
@RestController @RequestMapping("/api/v1/appointments")
public class AppointmentController {
    private final AppointmentService service;
    public AppointmentController(AppointmentService service) { this.service = service; }
    @PostMapping
    @RequirePermission("appointments:write")
    @AuditLog(action = "CREATE_APPOINTMENT")
    public ResponseEntity<ApiResponse<AppointmentResponse>> book(@Valid @RequestBody AppointmentRequest request) {
        UUID patientId = parseId(request.getPatientId(), "Patient");
        UUID providerId = parseId(request.getProviderId(), "Provider");
        var response = service.bookAppointment(
            patientId, providerId, request.getAppointmentTime(),
            request.getAppointmentTime().plus(Duration.ofMinutes(30)), "CONSULTATION"
        );
        return new ResponseEntity<>(ApiResponse.success(response), HttpStatus.CREATED);
    }
    @GetMapping("/patient/{patientId}")
    @RequirePermission("appointments:read")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getForPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(ApiResponse.success(service.getAppointmentsForPatient(patientId)));
    }
    @PatchMapping("/{id}/status")
    @RequirePermission("appointments:write")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
        @PathVariable UUID id,
        @RequestParam String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.updateStatus(id, status)));
    }

    private static UUID parseId(String value, String name) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            throw new health.caresync.common.exception.ValidationException(name + " ID must be a UUID");
        }
    }
}
