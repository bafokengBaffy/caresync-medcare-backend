package health.caresync.billing.controller;

import health.caresync.billing.dto.BillingSummaryResponse;
import health.caresync.billing.dto.InvoiceCreateRequest;
import health.caresync.billing.dto.InvoiceResponse;
import health.caresync.billing.service.InvoiceService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'RECEPTION')")
    public InvoiceResponse create(@Valid @RequestBody InvoiceCreateRequest request) {
        return invoiceService.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'RECEPTION', 'MANAGER')")
    public InvoiceResponse get(@PathVariable UUID id) {
        return invoiceService.get(id);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'MANAGER')")
    public BillingSummaryResponse summary() {
        return invoiceService.summary();
    }
}
