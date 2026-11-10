package health.caresync.billing.controller;

import health.caresync.billing.dto.RefundRequest;
import health.caresync.billing.dto.RefundResponse;
import health.caresync.billing.service.RefundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/refunds")
@PreAuthorize("hasRole('FINANCE')")
public class RefundController {
    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Process a payment refund")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Refund processed"),
        @ApiResponse(responseCode = "400", description = "Refund exceeds the remaining payment"),
        @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    public RefundResponse refund(@Valid @RequestBody RefundRequest request) {
        return refundService.refund(request);
    }

    @GetMapping
    @Operation(summary = "List processed refunds for the current tenant")
    @ApiResponse(responseCode = "200", description = "Refunds returned")
    public List<RefundResponse> list() {
        return refundService.list();
    }
}
