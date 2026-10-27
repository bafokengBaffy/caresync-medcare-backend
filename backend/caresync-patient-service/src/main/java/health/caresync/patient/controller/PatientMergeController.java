package health.caresync.patient.controller;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.dto.DuplicateSuggestion;
import health.caresync.patient.dto.MergeCancelRequest;
import health.caresync.patient.dto.MergeConfirmationRequest;
import health.caresync.patient.dto.MergeReverseRequest;
import health.caresync.patient.dto.MergeStatisticsResponse;
import health.caresync.patient.dto.PatientMergeRequest;
import health.caresync.patient.dto.PatientMergeResponse;
import health.caresync.patient.service.PatientMergeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/patient-merges")
public class PatientMergeController {
    private static final String READ_ACCESS =
        "hasAuthority('MERGE_READ') or hasAnyRole('ADMIN','MANAGER','RECEPTION','PROVIDER',"
            + "'STAFF','MERGE_MANAGER','PRIVACY_OFFICER','CLINICIAN')";
    private static final String WRITE_ACCESS =
        "hasAnyAuthority('MERGE_WRITE') or hasAnyRole('ADMIN','MANAGER','MERGE_MANAGER',"
            + "'PRIVACY_OFFICER','RECEPTION','PROVIDER','STAFF')";
    private static final String ADMIN_ACCESS =
        "hasAnyAuthority('MERGE_REVERSE') or hasAnyRole('ADMIN','MANAGER','MERGE_MANAGER','PRIVACY_OFFICER')";

    private final PatientMergeService mergeService;

    public PatientMergeController(PatientMergeService mergeService) {
        this.mergeService = mergeService;
    }

    @GetMapping("/duplicates")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<PageResponse<DuplicateSuggestion>> suggestDuplicates(
        @PathVariable UUID tenantId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "0.75") double minScore,
        @AuthenticationPrincipal CaresyncPrincipal principal
    ) {
        requireTenant(tenantId, principal);
        return ResponseEntity.ok(mergeService.suggestDuplicates(tenantId, page, size, minScore));
    }

    @PostMapping
    @PreAuthorize(WRITE_ACCESS)
    public ResponseEntity<ApiResponse<PatientMergeResponse>> requestMerge(
        @PathVariable UUID tenantId,
        @Valid @RequestBody PatientMergeRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId
    ) {
        requireTenant(tenantId, principal);
        String requestId = validCorrelationId(correlationId) ? correlationId : UUID.randomUUID().toString();
        PatientMergeResponse response = mergeService.requestMerge(
            tenantId, request, principal.userId(), requestId
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .header("X-Correlation-Id", requestId)
            .body(ApiResponse.ok(response));
    }

    @PostMapping("/{mergeId}/confirm")
    @PreAuthorize(ADMIN_ACCESS)
    public ResponseEntity<ApiResponse<PatientMergeResponse>> confirmMerge(
        @PathVariable UUID tenantId,
        @PathVariable UUID mergeId,
        @Valid @RequestBody(required = false) MergeConfirmationRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        PatientMergeResponse response = mergeService.confirmMerge(
            tenantId,
            mergeId,
            request == null ? null : request.reason(),
            principal.userId()
        );
        return ok(response, servletRequest);
    }

    @PostMapping("/{mergeId}/cancel")
    @PreAuthorize(WRITE_ACCESS)
    public ResponseEntity<ApiResponse<PatientMergeResponse>> cancelMerge(
        @PathVariable UUID tenantId,
        @PathVariable UUID mergeId,
        @Valid @RequestBody MergeCancelRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        PatientMergeResponse response = mergeService.cancelMerge(
            tenantId, mergeId, request.reason(), principal.userId(), principal.role()
        );
        return ok(response, servletRequest);
    }

    @PostMapping("/{mergeId}/reverse")
    @PreAuthorize(ADMIN_ACCESS)
    public ResponseEntity<ApiResponse<PatientMergeResponse>> reverseMerge(
        @PathVariable UUID tenantId,
        @PathVariable UUID mergeId,
        @Valid @RequestBody MergeReverseRequest request,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        PatientMergeResponse response = mergeService.reverseMerge(
            tenantId, mergeId, request.reason(), principal.userId()
        );
        return ok(response, servletRequest);
    }

    @GetMapping("/{mergeId}")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<ApiResponse<PatientMergeResponse>> getMerge(
        @PathVariable UUID tenantId,
        @PathVariable UUID mergeId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        return ok(mergeService.getMerge(tenantId, mergeId), servletRequest);
    }

    @GetMapping
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<PageResponse<PatientMergeResponse>> listMerges(
        @PathVariable UUID tenantId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String sort,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @AuthenticationPrincipal CaresyncPrincipal principal
    ) {
        requireTenant(tenantId, principal);
        return ResponseEntity.ok(mergeService.listMerges(
            tenantId, page, size, sort, status, from, to
        ));
    }

    @GetMapping("/patients/{patientId}/history")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<ApiResponse<List<PatientMergeResponse>>> getHistoryForPatient(
        @PathVariable UUID tenantId,
        @PathVariable UUID patientId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        return ok(mergeService.getMergeHistoryForPatient(tenantId, patientId), servletRequest);
    }

    @GetMapping("/statistics")
    @PreAuthorize(READ_ACCESS)
    public ResponseEntity<ApiResponse<MergeStatisticsResponse>> getStatistics(
        @PathVariable UUID tenantId,
        @AuthenticationPrincipal CaresyncPrincipal principal,
        HttpServletRequest servletRequest
    ) {
        requireTenant(tenantId, principal);
        return ok(mergeService.getStatistics(tenantId), servletRequest);
    }

    private <T> ResponseEntity<ApiResponse<T>> ok(T value, HttpServletRequest request) {
        String header = request.getHeader("X-Correlation-Id");
        String correlationId = validCorrelationId(header) ? header : UUID.randomUUID().toString();
        return ResponseEntity.ok()
            .header("X-Correlation-Id", correlationId)
            .body(ApiResponse.ok(value));
    }

    private void requireTenant(UUID tenantId, CaresyncPrincipal principal) {
        if (principal == null || !Objects.equals(principal.tenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
    }

    private boolean validCorrelationId(String value) {
        return value != null && value.matches("[A-Za-z0-9._-]{1,128}");
    }
}