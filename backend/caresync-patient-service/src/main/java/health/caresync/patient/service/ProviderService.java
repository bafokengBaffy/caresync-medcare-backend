package health.caresync.patient.service;

import health.caresync.common.exception.NotFoundException;
import health.caresync.patient.domain.entity.Provider;
import health.caresync.patient.domain.repository.ProviderRepository;
import health.caresync.patient.dto.ProviderResponse;
import health.caresync.patient.mapper.ProviderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service handling business logic for Providers.
 */
@Service
public class ProviderService {

    private final ProviderRepository providerRepository;
    private final ProviderMapper providerMapper;

    public ProviderService(ProviderRepository providerRepository, ProviderMapper providerMapper) {
        this.providerRepository = providerRepository;
        this.providerMapper = providerMapper;
    }

    @Transactional(readOnly = true)
    public List<ProviderResponse> getAllProviders() {
        return providerRepository.findByIsActiveTrue().stream()
                .map(providerMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProviderResponse getProviderById(UUID id) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Provider", "id", id));
        return providerMapper.toResponse(provider);
    }
}
