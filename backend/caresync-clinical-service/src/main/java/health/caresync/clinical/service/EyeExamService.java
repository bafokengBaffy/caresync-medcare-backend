package health.caresync.clinical.service;

import health.caresync.clinical.domain.entity.EyeExam;
import health.caresync.clinical.domain.repository.EyeExamRepository;
import health.caresync.clinical.dto.EyeExamCreateRequest;
import health.caresync.clinical.dto.EyeExamResponse;
import health.caresync.clinical.mapper.EyeExamMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EyeExamService {
    private final EyeExamRepository repository;
    private final EyeExamMapper mapper;
    private final TenantRlsContext tenantRlsContext;
    private final ClinicalReferenceValidator referenceValidator;

    public EyeExamService(
        EyeExamRepository repository,
        EyeExamMapper mapper,
        TenantRlsContext tenantRlsContext,
        ClinicalReferenceValidator referenceValidator
    ) {
        this.repository = repository;
        this.mapper = mapper;
        this.tenantRlsContext = tenantRlsContext;
        this.referenceValidator = referenceValidator;
    }

    @Transactional
    public EyeExamResponse create(EyeExamCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        referenceValidator.requirePatient(tenantId, request.patientId());
        referenceValidator.requireActiveProvider(tenantId, request.providerId());
        EyeExam exam = mapper.toEntity(request);
        exam.setTenantId(tenantId);
        return mapper.toResponse(repository.save(exam));
    }

    @Transactional(readOnly = true)
    public EyeExamResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        return (providerId == null
            ? repository.findByIdAndTenantIdAndArchivedAtIsNull(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(id, tenantId, providerId))
            .map(mapper::toResponse)
            .orElseThrow(() -> new NotFoundException("Eye exam not found"));
    }

    @Transactional(readOnly = true)
    public List<EyeExamResponse> list(UUID patientId) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        if (patientId == null) {
            return (providerId == null
                ? repository.findTop100ByTenantIdAndArchivedAtIsNullOrderByExamDateDesc(tenantId)
                : repository.findTop100ByTenantIdAndProviderIdAndArchivedAtIsNullOrderByExamDateDesc(
                    tenantId, providerId
                )).stream()
                .map(mapper::toResponse)
                .toList();
        }
        referenceValidator.requirePatient(tenantId, patientId);
        return (providerId == null
            ? repository.findTop100ByTenantIdAndPatientIdAndArchivedAtIsNullOrderByExamDateDesc(
                tenantId, patientId
            )
            : repository.findTop100ByTenantIdAndPatientIdAndProviderIdAndArchivedAtIsNullOrderByExamDateDesc(
                tenantId, patientId, providerId
            )).stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Transactional
    public EyeExamResponse update(UUID id, EyeExamCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        EyeExam exam = (providerId == null
            ? repository.findByIdAndTenantIdAndArchivedAtIsNull(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(id, tenantId, providerId))
            .orElseThrow(() -> new NotFoundException("Eye exam not found"));
        referenceValidator.requirePatient(tenantId, request.patientId());
        referenceValidator.requireActiveProvider(tenantId, request.providerId());
        if (providerId != null && !providerId.equals(request.providerId())) {
            throw new NotFoundException("Eye exam not found");
        }
        exam.setPatientId(request.patientId());
        exam.setProviderId(request.providerId());
        exam.setExamDate(request.examDate());
        exam.setRightEyeAcuity(request.rightEyeAcuity());
        exam.setLeftEyeAcuity(request.leftEyeAcuity());
        exam.setDiagnosis(request.diagnosis());
        exam.setPrescription(request.prescription());
        exam.setNotes(request.notes());
        return mapper.toResponse(repository.save(exam));
    }

    @Transactional
    public void archive(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        UUID providerId = referenceValidator.providerIdForCurrentProvider(tenantId);
        EyeExam exam = (providerId == null
            ? repository.findByIdAndTenantIdAndArchivedAtIsNull(id, tenantId)
            : repository.findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(id, tenantId, providerId))
            .orElseThrow(() -> new NotFoundException("Eye exam not found"));
        exam.setArchivedAt(Instant.now());
        repository.save(exam);
    }
}