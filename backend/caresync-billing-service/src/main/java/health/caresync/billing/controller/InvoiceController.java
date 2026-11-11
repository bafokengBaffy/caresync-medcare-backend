package health.caresync.billing.controller;
import health.caresync.billing.domain.entity.Invoice;
import health.caresync.billing.service.InvoiceQueryService;
import health.caresync.billing.service.InvoiceService;
import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import health.caresync.billing.dto.BillingSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.List; import java.util.UUID;
@RestController
@RequestMapping("/api/v1/invoices")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'RECEPTION', 'FINANCE', 'MANAGER')")
public class InvoiceController {
    private final InvoiceService service;
    private final InvoiceQueryService queryService;
    public InvoiceController(InvoiceService service, InvoiceQueryService queryService) {
        this.service = service;
        this.queryService = queryService;
    }

    @GetMapping
    @RequirePermission("billing:read")
    public Page<health.caresync.billing.domain.Invoice> list(@PageableDefault(size = 20) Pageable pageable) {
        return queryService.list(pageable);
    }

    @GetMapping("/summary")
    @RequirePermission("billing:read")
    public BillingSummaryResponse summary() {
        return queryService.summary();
    }
    @PostMapping
    @RequirePermission("billing:write")
    @AuditLog(action = "CREATE_INVOICE")
    public ResponseEntity<ApiResponse<Invoice>> create(@RequestParam String patientId, @RequestParam BigDecimal amount) {
        return new ResponseEntity<>(ApiResponse.success(service.createInvoice(patientId, amount)), HttpStatus.CREATED);
    }
    @GetMapping("/patient/{patientId}")
    @RequirePermission("billing:read")
    public ResponseEntity<ApiResponse<List<Invoice>>> getForPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(ApiResponse.success(service.getInvoicesForPatient(patientId)));
    }
}
