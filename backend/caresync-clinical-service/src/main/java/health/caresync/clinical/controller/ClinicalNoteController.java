package health.caresync.clinical.controller;

import health.caresync.clinical.dto.ClinicalNoteCreateRequest;
import health.caresync.clinical.dto.ClinicalNoteResponse;
import health.caresync.clinical.dto.ClinicalNoteSummary;
import health.caresync.clinical.service.ClinicalNoteService;
import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import health.caresync.common.web.PageResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notes")
public class ClinicalNoteController {
    private final ClinicalNoteService service;

    public ClinicalNoteController(ClinicalNoteService service) {
        this.service = service;
    }

    @PostMapping
    @RequirePermission("notes:write")
    @AuditLog(action = "CREATE_CLINICAL_NOTE")
    public ResponseEntity<ApiResponse<ClinicalNoteResponse>> createNote(
        @Valid @RequestBody ClinicalNoteCreateRequest request
    ) {
        return new ResponseEntity<>(
            ApiResponse.success(service.create(request)),
            HttpStatus.CREATED
        );
    }

    @GetMapping("/patient/{patientId}")
    @RequirePermission("notes:read")
    @AuditLog(action = "READ_CLINICAL_NOTES")
    public ResponseEntity<ApiResponse<PageResponse<ClinicalNoteSummary>>> getNotes(
        @PathVariable UUID patientId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.listForPatient(patientId, page, size, query)));
    }

    @GetMapping("/{noteId}")
    @RequirePermission("notes:read")
    @AuditLog(action = "READ_CLINICAL_NOTE")
    public ResponseEntity<ApiResponse<ClinicalNoteResponse>> getNote(@PathVariable String noteId) {
        return ResponseEntity.ok(ApiResponse.success(service.get(noteId)));
    }
}
