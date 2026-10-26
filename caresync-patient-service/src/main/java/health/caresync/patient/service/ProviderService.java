package health.caresync.patient.service;
import health.caresync.patient.domain.repository.ProviderRepository;
import health.caresync.patient.domain.entity.Provider;
import health.caresync.patient.dto.*;
import health.caresync.patient.mapper.ProviderMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

    @Transactional(readOnly = true)
    public PageResponse<ProviderSummaryResponse> list(
        String query,
        String specialty,
        Boolean active,
        int page,
        int size
    ) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
        UUID tenantId = tenantRlsContext.apply();
        Page<Provider> providers = repo.searchByTenantId(
            tenantId,
            query == null ? "" : query.trim(),
            specialty == null ? "" : specialty.trim(),
            active,
            PageRequest.of(page, size, Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()))
        );
        List<ProviderSummaryResponse> content = providers.getContent().stream()
            .map(mapper::toSummary)
            .toList();
        return new PageResponse<>(content, page, size, providers.getTotalElements());
    }

    @Transactional
    public ProviderResponse create(ProviderCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (repo.existsByTenantIdAndUserId(tenantId, request.userId())) {
            throw new ValidationException("A provider profile already exists for this user");
        }
        return mapper.toResponse(repo.save(mapper.toEntity(request)));
    }

    @Transactional
    public ProviderResponse update(UUID id, ProviderUpdateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        Provider provider = repo.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("Provider not found"));
        if (request.firstName() != null) provider.setFirstName(request.firstName());
        if (request.lastName() != null) provider.setLastName(request.lastName());
        if (request.specialty() != null) provider.setSpecialty(request.specialty());
        if (request.licenseNumber() != null) provider.setLicenseNumber(request.licenseNumber());
        if (request.email() != null) provider.setEmail(request.email());
        if (request.phoneNumber() != null) provider.setPhoneNumber(request.phoneNumber());
        if (request.npi() != null) provider.setNpi(request.npi());
        if (request.yearsOfExperience() != null) provider.setYearsOfExperience(request.yearsOfExperience());
        if (request.bio() != null) provider.setBio(request.bio());
        if (request.active() != null) provider.setActive(request.active());
        return mapper.toResponse(provider);
    }

    @Transactional
    public void deactivate(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        Provider provider = repo.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("Provider not found"));
        provider.setActive(false);
    }
}