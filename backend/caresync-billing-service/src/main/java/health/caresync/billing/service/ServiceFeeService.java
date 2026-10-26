package health.caresync.billing.service;

import health.caresync.billing.domain.ServiceFee;
import health.caresync.billing.domain.ServiceFeeRepository;
import health.caresync.billing.dto.ServiceFeeCreateRequest;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceFeeService {
    private final ServiceFeeRepository fees;
    private final TenantRlsContext tenantRlsContext;

    public ServiceFeeService(ServiceFeeRepository fees, TenantRlsContext tenantRlsContext) {
        this.fees = fees;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public ServiceFee create(ServiceFeeCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        ServiceFee fee = new ServiceFee();
        fee.setTenantId(tenantId);
        fee.setCode(request.code());
        fee.setDescription(request.description());
        fee.setUnitPriceCents(request.unitPriceCents());
        if (request.currency() != null) {
            fee.setCurrency(request.currency());
        }
        return fees.save(fee);
    }
}
