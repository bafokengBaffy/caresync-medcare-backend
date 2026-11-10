package health.caresync.clinical.controller;

import health.caresync.clinical.dto.AnalyticsExportResponse;
import health.caresync.clinical.service.AnalyticsDataExtractorService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics/clinical-data")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AnalyticsDataExtractorController {
    private final AnalyticsDataExtractorService extractorService;

    public AnalyticsDataExtractorController(AnalyticsDataExtractorService extractorService) {
        this.extractorService = extractorService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public AnalyticsExportResponse exportJson(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return extractorService.extract(fromDate, toDate);
    }

    @GetMapping(value = "/csv", produces = "text/csv")
    public ResponseEntity<String> exportCsv(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        AnalyticsExportResponse export = extractorService.extract(fromDate, toDate);
        return ResponseEntity.ok()
            .contentType(new MediaType("text", "csv"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=clinical-analytics.csv")
            .body(extractorService.toCsv(export));
    }
}
