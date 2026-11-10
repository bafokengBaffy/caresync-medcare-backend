package health.caresync.billing.controller;

import health.caresync.billing.domain.Payment;
import health.caresync.billing.dto.PaymentCreateRequest;
import health.caresync.billing.service.PaymentService;
import health.caresync.common.annotation.AuditLog;
import health.caresync.common.annotation.RequirePermission;
import health.caresync.common.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping
    @RequirePermission("billing:write")
    @AuditLog(action = "RECORD_PAYMENT")
    public ResponseEntity<ApiResponse<Payment>> record(@Valid @RequestBody PaymentCreateRequest request) {
        return new ResponseEntity<>(
            ApiResponse.success(service.record(request)),
            HttpStatus.CREATED
        );
    }
}
