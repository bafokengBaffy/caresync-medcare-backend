package health.caresync.billing.controller;

import health.caresync.billing.dto.PaymentCreateRequest;
import health.caresync.billing.dto.PaymentResponse;
import health.caresync.common.web.PageResponse;
import health.caresync.billing.service.PaymentService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public PaymentResponse record(@Valid @RequestBody PaymentCreateRequest request) {
        return paymentService.record(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'RECEPTION', 'STAFF', 'MANAGER')")
    public PageResponse<PaymentResponse> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return paymentService.list(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'RECEPTION', 'STAFF', 'MANAGER')")
    public PaymentResponse get(@PathVariable UUID id) {
        return paymentService.get(id);
    }
}
