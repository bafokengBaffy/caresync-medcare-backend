package health.caresync.clinical.service;

import health.caresync.clinical.domain.entity.MentalHealthAssessment;
import health.caresync.clinical.domain.repository.MentalHealthAssessmentRepository;
import health.caresync.clinical.dto.MentalHealthAssessmentRequest;
import health.caresync.clinical.dto.MentalHealthAssessmentResponse;
import health.caresync.clinical.mapper.MentalHealthAssessmentMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentalHealthAssessmentService {
    private final MentalHealthAssessmentRepository repository;
    private final MentalHealthAssessmentMapper mapper;
    private final TenantRlsContext tenantRlsContext;
    private final ClinicalReferenceValidator referenceValidator;

    public MentalHealthAssessmentService(
        MentalHealthAssessmentRepository repository,
        MentalHealthAssessmentMapper mapper,
        TenantRlsContext tenantRlsContext,
        ClinicalReferenceValidator referenceValidator
    ) {
        this.repository = repository;
        this.mapper = mapper;
        this.tenantRlsContext = tenantRlsContext;
        this.referenceValidator = referenceValidator;
    }

    @Transactional
    public MentalHealthAssessmentResponse create(MentalHealthAssessmentRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        referenceValidator.requirePatient(tenantId, request.patientId());
        referenceValidator.requireActiveProvider(tenantId, request.providerId());
        MentalHealthAssessment assessment = mapper.toEntity(request);
        assessment.setTenantId(tenantId);
        return mapper.toResponse(repository.save(assessment));
    }

    @Transactional(readOnly = true)
    public MentalHealthAssessmentResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        return (providerId == null
            ? repository.findByIdAndTenantId(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderId(id, tenantId, providerId))
            .map(mapper::toResponse)
            .orElseThrow(() -> new NotFoundException("Mental health assessment not found"));
    }

    @Transactional(readOnly = true)
    public List<MentalHealthAssessmentResponse> list(UUID patientId) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        if (patientId == null) {
            return (providerId == null
                ? repository.findTop100ByTenantIdOrderByAssessmentDateDesc(tenantId)
                : repository.findTop100ByTenantIdAndProviderIdOrderByAssessmentDateDesc(tenantId, providerId)).stream()
                .map(mapper::toResponse)
                .toList();
        }
        referenceValidator.requirePatient(tenantId, patientId);
        return (providerId == null
            ? repository.findTop100ByTenantIdAndPatientIdOrderByAssessmentDateDesc(tenantId, patientId)
            : repository.findTop100ByTenantIdAndPatientIdAndProviderIdOrderByAssessmentDateDesc(
                tenantId, patientId, providerId
            )).stream()
            .map(mapper::toResponse)
            .toList();
    }
}