package health.caresync.billing.controller;
import health.caresync.billing.domain.entity.Invoice;
import health.caresync.billing.service.InvoiceService;
import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.List; import java.util.UUID;
@RestController @RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceService service;
    public InvoiceController(InvoiceService service) { this.service = service; }
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
