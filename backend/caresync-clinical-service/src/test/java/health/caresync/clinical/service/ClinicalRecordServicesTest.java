package health.caresync.clinical.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.clinical.domain.entity.DentalChart;
import health.caresync.clinical.domain.entity.EyeExam;
import health.caresync.clinical.domain.entity.MentalHealthAssessment;
import health.caresync.clinical.domain.entity.NursingAssessment;
import health.caresync.clinical.domain.repository.DentalChartRepository;
import health.caresync.clinical.domain.repository.EyeExamRepository;
import health.caresync.clinical.domain.repository.MentalHealthAssessmentRepository;
import health.caresync.clinical.domain.repository.NursingAssessmentRepository;
import health.caresync.clinical.dto.DentalChartCreateRequest;
import health.caresync.clinical.dto.DentalChartResponse;
import health.caresync.clinical.dto.EyeExamCreateRequest;
import health.caresync.clinical.dto.EyeExamResponse;
import health.caresync.clinical.dto.MentalHealthAssessmentRequest;
import health.caresync.clinical.dto.MentalHealthAssessmentResponse;
import health.caresync.clinical.dto.NursingAssessmentCreateRequest;
import health.caresync.clinical.dto.NursingAssessmentResponse;
import health.caresync.clinical.mapper.DentalChartMapper;
import health.caresync.clinical.mapper.EyeExamMapper;
import health.caresync.clinical.mapper.MentalHealthAssessmentMapper;
import health.caresync.clinical.mapper.NursingAssessmentMapper;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ClinicalRecordServicesTest {
    private final UUID tenantId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();
    private final UUID providerId = UUID.randomUUID();

    @Test
    void dentalChartCreationUsesTenantAndValidatesPatientAndProvider() {
        DentalChartRepository repository = mock(DentalChartRepository.class);
        DentalChartMapper mapper = mock(DentalChartMapper.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        ClinicalReferenceValidator references = mock(ClinicalReferenceValidator.class);
        DentalChart entity = new DentalChart();
        DentalChartResponse response = new DentalChartResponse(
            UUID.randomUUID(), tenantId, patientId, providerId, requestDate(), "Routine exam", null, null, null, null
        );
        DentalChartCreateRequest request = new DentalChartCreateRequest(
            patientId, providerId, LocalDate.now(), "Routine exam", null, null
        );
        when(tenantContext.apply()).thenReturn(tenantId);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(response);

        assertSame(response, new DentalChartService(repository, mapper, tenantContext, references).create(request));

        assertEquals(tenantId, entity.getTenantId());
        verify(references).requirePatient(tenantId, patientId);
        verify(references).requireActiveProvider(tenantId, providerId);
    }

    @Test
    void eyeExamCreationUsesTenantAndValidatesPatientAndProvider() {
        EyeExamRepository repository = mock(EyeExamRepository.class);
        EyeExamMapper mapper = mock(EyeExamMapper.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        ClinicalReferenceValidator references = mock(ClinicalReferenceValidator.class);
        EyeExam entity = new EyeExam();
        EyeExamResponse response = new EyeExamResponse(
            UUID.randomUUID(), tenantId, patientId, providerId, requestDate(), null, null, null, null, null, null, null
        );
        EyeExamCreateRequest request = new EyeExamCreateRequest(
            patientId, providerId, LocalDate.now(), null, null, null, null, null
        );
        when(tenantContext.apply()).thenReturn(tenantId);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(response);

        assertSame(response, new EyeExamService(repository, mapper, tenantContext, references).create(request));

        assertEquals(tenantId, entity.getTenantId());
        verify(references).requirePatient(tenantId, patientId);
        verify(references).requireActiveProvider(tenantId, providerId);
    }

    @Test
    void nursingAssessmentCreationUsesTenantAndValidatesPatientAndProvider() {
        NursingAssessmentRepository repository = mock(NursingAssessmentRepository.class);
        NursingAssessmentMapper mapper = mock(NursingAssessmentMapper.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        ClinicalReferenceValidator references = mock(ClinicalReferenceValidator.class);
        NursingAssessment entity = new NursingAssessment();
        NursingAssessmentResponse response = new NursingAssessmentResponse(
            UUID.randomUUID(), tenantId, patientId, providerId, requestDate(), null,
            "Assessment findings", null, null, null, null
        );
        NursingAssessmentCreateRequest request = new NursingAssessmentCreateRequest(
            patientId, providerId, LocalDate.now(), null, "Assessment findings", null, null
        );
        when(tenantContext.apply()).thenReturn(tenantId);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(response);

        assertSame(response, new NursingAssessmentService(repository, mapper, tenantContext, references).create(request));

        assertEquals(tenantId, entity.getTenantId());
        verify(references).requirePatient(tenantId, patientId);
        verify(references).requireActiveProvider(tenantId, providerId);
    }

    @Test
    void mentalHealthAssessmentCreationUsesTenantAndValidatesPatientAndProvider() {
        MentalHealthAssessmentRepository repository = mock(MentalHealthAssessmentRepository.class);
        MentalHealthAssessmentMapper mapper = mock(MentalHealthAssessmentMapper.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        ClinicalReferenceValidator references = mock(ClinicalReferenceValidator.class);
        MentalHealthAssessment entity = new MentalHealthAssessment();
        MentalHealthAssessmentResponse response = new MentalHealthAssessmentResponse(
            UUID.randomUUID(), tenantId, patientId, providerId, requestDate(), "PHQ-9", 0,
            "Assessment findings", null, null, null, null, null
        );
        MentalHealthAssessmentRequest request = new MentalHealthAssessmentRequest(
            patientId, providerId, LocalDate.now(), "PHQ-9", 0, "Assessment findings", null, null, null
        );
        when(tenantContext.apply()).thenReturn(tenantId);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(response);

        assertSame(
            response,
            new MentalHealthAssessmentService(repository, mapper, tenantContext, references).create(request)
        );

        assertEquals(tenantId, entity.getTenantId());
        verify(references).requirePatient(tenantId, patientId);
        verify(references).requireActiveProvider(tenantId, providerId);
    }

    private static LocalDate requestDate() {
        return LocalDate.of(2026, 1, 1);
    }
}
