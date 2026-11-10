package health.caresync.billing.controller;

import health.caresync.billing.dto.MedicalAidClaimDecisionRequest;
import health.caresync.billing.dto.MedicalAidClaimRequest;
import health.caresync.billing.dto.MedicalAidClaimResponse;
import health.caresync.billing.service.MedicalAidClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/medical-aid-claims")
@PreAuthorize("hasRole('FINANCE')")
public class MedicalAidClaimController {
    private final MedicalAidClaimService claimService;

    public MedicalAidClaimController(MedicalAidClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Submit a medical aid claim")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Claim submitted"),
        @ApiResponse(responseCode = "400", description = "Invalid claim or invoice"),
        @ApiResponse(responseCode = "404", description = "Invoice not found")
    })
    public MedicalAidClaimResponse submit(@Valid @RequestBody MedicalAidClaimRequest request) {
        return claimService.submit(request);
    }

    @GetMapping
    @Operation(summary = "List medical aid claims for the current tenant")
    @ApiResponse(responseCode = "200", description = "Claims returned")
    public List<MedicalAidClaimResponse> list() {
        return claimService.list();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a medical aid claim")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Claim returned"),
        @ApiResponse(responseCode = "404", description = "Claim not found")
    })
    public MedicalAidClaimResponse get(@PathVariable UUID id) {
        return claimService.get(id);
    }

    @PatchMapping("/{id}/decision")
    @Operation(summary = "Approve or reject a submitted claim")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Claim decision recorded"),
        @ApiResponse(responseCode = "400", description = "Invalid claim transition"),
        @ApiResponse(responseCode = "404", description = "Claim not found")
    })
    public MedicalAidClaimResponse decide(
        @PathVariable UUID id,
        @Valid @RequestBody MedicalAidClaimDecisionRequest request
    ) {
        return claimService.decide(id, request);
    }
}
