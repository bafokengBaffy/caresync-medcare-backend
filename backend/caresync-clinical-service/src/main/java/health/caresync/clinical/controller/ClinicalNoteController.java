package health.caresync.clinical.controller;

import health.caresync.clinical.dto.ClinicalNoteCreateRequest;
import health.caresync.clinical.dto.ClinicalNoteResponse;
import health.caresync.clinical.dto.ClinicalNoteSummary;
import health.caresync.clinical.service.ClinicalNoteService;
import health.caresync.common.web.PageResponse;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/notes")
public class ClinicalNoteController {
    private final ClinicalNoteService clinicalNoteService;

    public ClinicalNoteController(ClinicalNoteService clinicalNoteService) {
        this.clinicalNoteService = clinicalNoteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public ClinicalNoteResponse create(@Valid @RequestBody ClinicalNoteCreateRequest request) {
        return clinicalNoteService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public PageResponse<ClinicalNoteSummary> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String search
    ) {
        return clinicalNoteService.list(page, size, search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public ClinicalNoteResponse get(@PathVariable String id) {
        return clinicalNoteService.get(id);
    }
}
