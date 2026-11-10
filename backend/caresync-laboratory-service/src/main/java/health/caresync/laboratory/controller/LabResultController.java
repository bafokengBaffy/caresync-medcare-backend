package health.caresync.laboratory.controller;
import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import health.caresync.laboratory.domain.entity.LabResult;
import health.caresync.laboratory.service.LabResultService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List; import java.util.UUID;
@RestController @RequestMapping("/api/v1/lab-results")
public class LabResultController {
    private final LabResultService service;
    public LabResultController(LabResultService service) { this.service = service; }
    @PostMapping
    @RequirePermission("lab:write")
    @AuditLog(action = "CREATE_LAB_REQUEST")
    public ResponseEntity<ApiResponse<LabResult>> requestTest(@RequestParam String patientId, @RequestParam String testName) {
        return new ResponseEntity<>(ApiResponse.success(service.createResult(patientId, testName)), HttpStatus.CREATED);
    }
    @PatchMapping("/{id}/complete")
    @RequirePermission("lab:write")
    @AuditLog(action = "COMPLETE_LAB_TEST")
    public ResponseEntity<ApiResponse<LabResult>> completeTest(@PathVariable UUID id, @RequestParam String resultValue) {
        return ResponseEntity.ok(ApiResponse.success(service.completeResult(id, resultValue)));
    }
    @GetMapping("/patient/{patientId}")
    @RequirePermission("lab:read")
    @AuditLog(action = "READ_LAB_RESULTS")
    public ResponseEntity<ApiResponse<List<LabResult>>> getResults(@PathVariable String patientId) {
        return ResponseEntity.ok(ApiResponse.success(service.getResultsForPatient(patientId)));
    }
}
