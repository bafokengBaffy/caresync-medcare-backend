package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.PatientReferralCreateRequest;
import health.caresync.patient.dto.PatientReferralResponse;
import health.caresync.patient.dto.PatientReferralStatusRequest;
import health.caresync.patient.service.PatientReferralService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/referrals")
public class PatientReferralController {
    private final PatientReferralService referralService;

    public PatientReferralController(PatientReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','TENANT_ADMIN','ADMIN','PROVIDER','CLINICIAN','STAFF','RECEPTION','MANAGER') "
        + "or hasAuthority('PATIENT_READ')")
    public ResponseEntity<ApiResponse<PageResponse<PatientReferralResponse>>> list(
        @PathVariable UUID patientId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(referralService.list(patientId, page, size)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','TENANT_ADMIN','ADMIN','PROVIDER','CLINICIAN','STAFF','MANAGER')")
    public ResponseEntity<ApiResponse<PatientReferralResponse>> create(
        @PathVariable UUID patientId,
        @Valid @RequestBody PatientReferralCreateRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
            referralService.create(patientId, request, actor, servletRequest)
        ));
    }

    @PatchMapping("/{referralId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','TENANT_ADMIN','ADMIN','PROVIDER','CLINICIAN','MANAGER')")
    public ResponseEntity<ApiResponse<PatientReferralResponse>> updateStatus(
        @PathVariable UUID patientId,
        @PathVariable UUID referralId,
        @Valid @RequestBody PatientReferralStatusRequest request,
        @AuthenticationPrincipal CaresyncPrincipal actor,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
            referralService.updateStatus(patientId, referralId, request, actor, servletRequest)
        ));
    }
}
