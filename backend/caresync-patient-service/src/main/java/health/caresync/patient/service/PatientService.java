package health.caresync.patient.service;

import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.dto.PatientCreateRequest;
import health.caresync.patient.dto.PatientResponse;
import health.caresync.patient.dto.PatientUpdateRequest;
import health.caresync.patient.mapper.PatientMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service handling business logic for Patients.
 * OWASP Alignment: Enforces Tenant Isolation on every query and mutation.
 * Validates that the current user has the right to access the specific patient record.
 */
@Service
public class PatientService {

    private static final Logger log = LoggerFactory.getLogger(PatientService.class);
    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final TenantRlsContext tenantRlsContext;

    public PatientService(
        PatientRepository patientRepository,
        PatientMapper patientMapper,
        TenantRlsContext tenantRlsContext
    ) {
        this.patientRepository = patientRepository;
        this.patientMapper = patientMapper;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getAllPatients() {
        UUID tenantId = tenantRlsContext.apply();
        return patientRepository.findAllByTenantIdAndMergedIntoPatientIdIsNull(
                tenantId, org.springframework.data.domain.PageRequest.of(0, 100)
            ).getContent().stream()
                .map(patientMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientById(UUID id) {
        return get(id);
    }

    @Transactional(readOnly = true)
    public PatientResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        Patient patient = patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Patient", "id", id));
        return patientMapper.toResponse(patient);
    }

    @Transactional
    public PatientResponse createPatient(PatientCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (request.getEmail() != null && !request.getEmail().isBlank()
            && patientRepository.existsByTenantIdAndEmailIgnoreCase(tenantId, request.getEmail())) {
            throw new ValidationException("A patient with this email already exists.");
        }

        Patient patient = patientMapper.toEntity(request);
        patient.setTenantId(tenantId);
        Patient saved = patientRepository.save(patient);
        log.info("Created new patient with ID: {} for tenant: {}", saved.getId(), tenantId);
        return patientMapper.toResponse(saved);
    }

    @Transactional
    public PatientResponse updatePatient(UUID id, PatientUpdateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        Patient patient = patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Patient", "id", id));

        if (request.getEmail() != null && !request.getEmail().isBlank()
            && !request.getEmail().equalsIgnoreCase(patient.getEmail())
            && patientRepository.existsByTenantIdAndEmailIgnoreCase(tenantId, request.getEmail())) {
            throw new ValidationException("A patient with this email already exists.");
        }

        // Update only mutable fields
        if (request.getFirstName() != null) patient.setFirstName(request.getFirstName());
        if (request.getLastName() != null) patient.setLastName(request.getLastName());
        if (request.getGender() != null) patient.setGender(request.getGender());
        if (request.getEmail() != null) patient.setEmail(request.getEmail());
        if (request.getPhone() != null) patient.setPhone(request.getPhone());
        if (request.getAddress() != null) patient.setAddress(request.getAddress());
        if (request.getEmergencyContactName() != null) patient.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactPhone() != null) patient.setEmergencyContactPhone(request.getEmergencyContactPhone());

        Patient updated = patientRepository.save(patient);
        log.info("Updated patient with ID: {}", updated.getId());
        return patientMapper.toResponse(updated);
    }

    @Transactional
    public void deletePatient(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        Patient patient = patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Patient", "id", id));
        patientRepository.delete(patient);
        log.info("Deleted patient with ID: {}", id);
    }
}
