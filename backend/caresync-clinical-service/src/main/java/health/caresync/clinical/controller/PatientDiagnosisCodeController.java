package health.caresync.clinical.controller;

import health.caresync.clinical.dto.PatientDiagnosisCodeRequest;
import health.caresync.clinical.dto.PatientDiagnosisCodeResponse;
import health.caresync.clinical.service.PatientDiagnosisCodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/diagnosis-codes")
public class PatientDiagnosisCodeController {
    private final PatientDiagnosisCodeService diagnosisCodeService;

    public PatientDiagnosisCodeController(PatientDiagnosisCodeService diagnosisCodeService) {
        this.diagnosisCodeService = diagnosisCodeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public PatientDiagnosisCodeResponse create(
        @Valid @RequestBody PatientDiagnosisCodeRequest request
    ) {
        return diagnosisCodeService.create(request);
    }
}
