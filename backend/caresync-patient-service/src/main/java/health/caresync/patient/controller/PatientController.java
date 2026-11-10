package health.caresync.patient.controller;

import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.PatientCreateRequest;
import health.caresync.patient.dto.PatientResponse;
import health.caresync.patient.dto.PatientUpdateRequest;
import health.caresync.patient.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Patient operations.
 * OWASP Alignment: Implements Rate Limiting (via Gateway), Method-level security (RequirePermission),
 * and Audit Logging for sensitive clinical data access.
 */
@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    @RequirePermission("patients:read")
    public ResponseEntity<ApiResponse<List<PatientResponse>>> getAllPatients() {
        List<PatientResponse> patients = patientService.getAllPatients();
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    @GetMapping("/{id}")
    @RequirePermission("patients:read")
    @AuditLog(action = "READ_PATIENT", description = "Accessed individual patient record")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientById(@PathVariable UUID id) {
        PatientResponse patient = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    @PostMapping
    @RequirePermission("patients:write")
    @AuditLog(action = "CREATE_PATIENT", description = "Created a new patient record")
    public ResponseEntity<ApiResponse<PatientResponse>> createPatient(@Valid @RequestBody PatientCreateRequest request) {
        PatientResponse patient = patientService.createPatient(request);
        return new ResponseEntity<>(ApiResponse.success("Patient created successfully", patient), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @RequirePermission("patients:write")
    @AuditLog(action = "UPDATE_PATIENT", description = "Updated patient record")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(
            @PathVariable UUID id, 
            @Valid @RequestBody PatientUpdateRequest request) {
        PatientResponse patient = patientService.updatePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success("Patient updated successfully", patient));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("patients:write")
    @AuditLog(action = "DELETE_PATIENT", description = "Deleted patient record")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable UUID id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(ApiResponse.success("Patient deleted successfully", null));
    }
}
