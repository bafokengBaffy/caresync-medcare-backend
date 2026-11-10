package health.caresync.clinical.controller;

import health.caresync.clinical.dto.EyeExamCreateRequest;
import health.caresync.clinical.dto.EyeExamResponse;
import health.caresync.clinical.service.EyeExamService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/eye-exams")
public class EyeExamController {
    private final EyeExamService service;

    public EyeExamController(EyeExamService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'CLINICIAN')")
    public EyeExamResponse create(@Valid @RequestBody EyeExamCreateRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'CLINICIAN', 'MANAGER')")
    public EyeExamResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'CLINICIAN', 'MANAGER')")
    public List<EyeExamResponse> list(@RequestParam(required = false) UUID patientId) {
        return service.list(patientId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'ADMIN', 'RECEPTION', 'STAFF', 'PROVIDER', 'CLINICIAN')")
    public EyeExamResponse update(@PathVariable UUID id, @Valid @RequestBody EyeExamCreateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'ADMIN', 'STAFF', 'PROVIDER', 'CLINICIAN')")
    public void archive(@PathVariable UUID id) {
        service.archive(id);
    }
}
