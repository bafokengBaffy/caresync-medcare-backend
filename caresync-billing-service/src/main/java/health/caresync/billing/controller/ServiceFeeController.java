package health.caresync.billing.controller;

import health.caresync.billing.domain.ServiceFee;
import health.caresync.billing.dto.ServiceFeeCreateRequest;
import health.caresync.billing.dto.ServiceFeeResponse;
import health.caresync.billing.service.ServiceFeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/service-fees")
public class ServiceFeeController {
    private final ServiceFeeService service;

    public ServiceFeeController(ServiceFeeService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceFeeResponse create(@Valid @RequestBody ServiceFeeCreateRequest request) {
        ServiceFee fee = service.create(request);
        return new ServiceFeeResponse(
            fee.getId(), fee.getCode(), fee.getDescription(), fee.getUnitPriceCents(),
            fee.getCurrency(), fee.isActive()
        );
    }
}
