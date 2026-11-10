package health.caresync.billing.controller;

import health.caresync.billing.dto.SlidingScaleRequest;
import health.caresync.billing.dto.SlidingScaleResponse;
import health.caresync.billing.dto.SlidingScaleRuleRequest;
import health.caresync.billing.dto.SlidingScaleRuleResponse;
import health.caresync.billing.service.SlidingScaleService;
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
@RequestMapping("/api/v1/sliding-scale")
@PreAuthorize("hasRole('FINANCE')")
public class SlidingScaleController {
    private final SlidingScaleService slidingScaleService;

    public SlidingScaleController(SlidingScaleService slidingScaleService) {
        this.slidingScaleService = slidingScaleService;
    }

    @PostMapping("/rules")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an income-bracket discount rule")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Rule created"),
        @ApiResponse(responseCode = "400", description = "Invalid or overlapping income bracket")
    })
    public SlidingScaleRuleResponse createRule(@Valid @RequestBody SlidingScaleRuleRequest request) {
        return slidingScaleService.createRule(request);
    }

    @GetMapping("/rules")
    @Operation(summary = "List income-bracket discount rules")
    @ApiResponse(responseCode = "200", description = "Rules returned")
    public List<SlidingScaleRuleResponse> listRules() {
        return slidingScaleService.listRules();
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply a sliding-scale discount to an unpaid invoice")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Discount applied"),
        @ApiResponse(responseCode = "400", description = "No matching rule or invoice is ineligible"),
        @ApiResponse(responseCode = "404", description = "Invoice not found")
    })
    public SlidingScaleResponse apply(@Valid @RequestBody SlidingScaleRequest request) {
        return slidingScaleService.apply(request);
    }
}
