package health.caresync.clinical.service;

import health.caresync.clinical.domain.entity.NursingAssessment;
import health.caresync.clinical.domain.repository.NursingAssessmentRepository;
import health.caresync.clinical.dto.NursingAssessmentCreateRequest;
import health.caresync.clinical.dto.NursingAssessmentResponse;
import health.caresync.clinical.mapper.NursingAssessmentMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NursingAssessmentService {
    private final NursingAssessmentRepository repository;
    private final NursingAssessmentMapper mapper;
    private final TenantRlsContext tenantRlsContext;
    private final ClinicalReferenceValidator referenceValidator;

    public NursingAssessmentService(
        NursingAssessmentRepository repository,
        NursingAssessmentMapper mapper,
        TenantRlsContext tenantRlsContext,
        ClinicalReferenceValidator referenceValidator
    ) {
        this.repository = repository;
        this.mapper = mapper;
        this.tenantRlsContext = tenantRlsContext;
        this.referenceValidator = referenceValidator;
    }

    @Transactional
    public NursingAssessmentResponse create(NursingAssessmentCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        referenceValidator.requirePatient(tenantId, request.patientId());
        referenceValidator.requireActiveProvider(tenantId, request.providerId());
        NursingAssessment assessment = mapper.toEntity(request);
        assessment.setTenantId(tenantId);
        return mapper.toResponse(repository.save(assessment));
    }

    @Transactional(readOnly = true)
    public NursingAssessmentResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        return (providerId == null
            ? repository.findByIdAndTenantId(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderId(id, tenantId, providerId))
            .map(mapper::toResponse)
            .orElseThrow(() -> new NotFoundException("Nursing assessment not found"));
    }

    @Transactional(readOnly = true)
    public List<NursingAssessmentResponse> list(UUID patientId) {
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