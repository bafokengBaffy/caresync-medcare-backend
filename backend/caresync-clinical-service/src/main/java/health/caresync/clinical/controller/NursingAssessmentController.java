package health.caresync.clinical.controller;

import health.caresync.clinical.dto.NursingAssessmentCreateRequest;
import health.caresync.clinical.dto.NursingAssessmentResponse;
import health.caresync.clinical.service.NursingAssessmentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/nursing-assessments")
public class NursingAssessmentController {
    private final NursingAssessmentService service;

    public NursingAssessmentController(NursingAssessmentService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF')")
    public NursingAssessmentResponse create(@Valid @RequestBody NursingAssessmentCreateRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public NursingAssessmentResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'MANAGER')")
    public List<NursingAssessmentResponse> list(@RequestParam(required = false) UUID patientId) {
        return service.list(patientId);
    }
}
