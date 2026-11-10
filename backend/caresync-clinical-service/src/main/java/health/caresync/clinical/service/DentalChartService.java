package health.caresync.clinical.service;

import health.caresync.clinical.domain.entity.DentalChart;
import health.caresync.clinical.domain.repository.DentalChartRepository;
import health.caresync.clinical.dto.DentalChartCreateRequest;
import health.caresync.clinical.dto.DentalChartResponse;
import health.caresync.clinical.mapper.DentalChartMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DentalChartService {
    private final DentalChartRepository repository;
    private final DentalChartMapper mapper;
    private final TenantRlsContext tenantRlsContext;
    private final ClinicalReferenceValidator referenceValidator;

    public DentalChartService(
        DentalChartRepository repository,
        DentalChartMapper mapper,
        TenantRlsContext tenantRlsContext,
        ClinicalReferenceValidator referenceValidator
    ) {
        this.repository = repository;
        this.mapper = mapper;
        this.tenantRlsContext = tenantRlsContext;
        this.referenceValidator = referenceValidator;
    }

    @Transactional
    public DentalChartResponse create(DentalChartCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        referenceValidator.requirePatient(tenantId, request.patientId());
        referenceValidator.requireActiveProvider(tenantId, request.providerId());
        DentalChart chart = mapper.toEntity(request);
        chart.setTenantId(tenantId);
        return mapper.toResponse(repository.save(chart));
    }

    @Transactional(readOnly = true)
    public DentalChartResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        return (providerId == null
            ? repository.findByIdAndTenantIdAndArchivedAtIsNull(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(id, tenantId, providerId))
            .map(mapper::toResponse)
            .orElseThrow(() -> new NotFoundException("Dental chart not found"));
    }

    @Transactional(readOnly = true)
    public List<DentalChartResponse> list(UUID patientId) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        if (patientId == null) {
            return (providerId == null
                ? repository.findTop100ByTenantIdAndArchivedAtIsNullOrderByChartDateDesc(tenantId)
                : repository.findTop100ByTenantIdAndProviderIdAndArchivedAtIsNullOrderByChartDateDesc(
                    tenantId, providerId
                )).stream()
                .map(mapper::toResponse)
                .toList();
        }
        referenceValidator.requirePatient(tenantId, patientId);
        return (providerId == null
            ? repository.findTop100ByTenantIdAndPatientIdAndArchivedAtIsNullOrderByChartDateDesc(
                tenantId, patientId
            )
            : repository.findTop100ByTenantIdAndPatientIdAndProviderIdAndArchivedAtIsNullOrderByChartDateDesc(
                tenantId, patientId, providerId
            )).stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Transactional
    public DentalChartResponse update(UUID id, DentalChartCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        DentalChart chart = (providerId == null
            ? repository.findByIdAndTenantIdAndArchivedAtIsNull(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(id, tenantId, providerId))
            .orElseThrow(() -> new NotFoundException("Dental chart not found"));
        referenceValidator.requirePatient(tenantId, request.patientId());
        referenceValidator.requireActiveProvider(tenantId, request.providerId());
        if (providerId != null && !providerId.equals(request.providerId())) {
            throw new NotFoundException("Dental chart not found");
        }
        chart.setPatientId(request.patientId());
        chart.setProviderId(request.providerId());
        chart.setChartDate(request.chartDate());
        chart.setFindings(request.findings());
        chart.setTreatmentPlan(request.treatmentPlan());
        chart.setNotes(request.notes());
        return mapper.toResponse(repository.save(chart));
    }

    @Transactional
    public void archive(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        DentalChart chart = (providerId == null
            ? repository.findByIdAndTenantIdAndArchivedAtIsNull(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(id, tenantId, providerId))
            .orElseThrow(() -> new NotFoundException("Dental chart not found"));
        chart.setArchivedAt(Instant.now());
        repository.save(chart);
    }
}