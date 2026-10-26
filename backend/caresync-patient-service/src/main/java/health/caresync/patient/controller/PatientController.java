package health.caresync.patient.controller;
import health.caresync.patient.dto.*;
import health.caresync.patient.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController @RequestMapping("/api/v1/patients")
public class PatientController {
    private final PatientService svc;
    public PatientController(PatientService s) { this.svc = s; }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public ResponseEntity<PatientResponse> create(@Valid @RequestBody PatientCreateRequest req) {
        return ResponseEntity.status(201).body(svc.create(req));
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public PatientResponse get(@PathVariable UUID id) { return svc.get(id); }
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public PatientResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody PatientUpdateRequest request
    ) {
        return svc.update(id, request);
    }
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public List<PatientSummaryResponse> list() { return svc.list(); }
}