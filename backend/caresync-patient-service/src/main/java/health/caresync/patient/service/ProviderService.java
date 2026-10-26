package health.caresync.patient.service;
import health.caresync.patient.domain.repository.ProviderRepository;
import health.caresync.patient.dto.*;
import health.caresync.patient.mapper.ProviderMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.tenant.TenantRlsContext;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class ProviderService {
    private final ProviderRepository repo;
    private final ProviderMapper mapper;
    private final TenantRlsContext tenantRlsContext;

    public ProviderService(ProviderRepository r, ProviderMapper m, TenantRlsContext tenantRlsContext) {
        this.repo = r;
        this.mapper = m;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public ProviderResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        return repo.findByIdAndTenantId(id, tenantId)
            .map(mapper::toResponse)
            .orElseThrow(() -> new NotFoundException("Provider not found"));
    }
}