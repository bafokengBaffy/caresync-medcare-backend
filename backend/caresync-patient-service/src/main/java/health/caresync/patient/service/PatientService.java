package health.caresync.patient.service;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.dto.*;
import health.caresync.patient.mapper.PatientMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class PatientService {
    private final PatientRepository repo;
    private final PatientMapper mapper;
    private final TenantRlsContext tenantRlsContext;

    public PatientService(PatientRepository r, PatientMapper m, TenantRlsContext tenantRlsContext) {
        this.repo = r;
        this.mapper = m;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public PatientResponse create(PatientCreateRequest req) {
        UUID tenantId = tenantRlsContext.apply();
        if (req.email() != null && !req.email().isBlank()
            && repo.existsByTenantIdAndEmailIgnoreCase(tenantId, req.email())) {
            throw new ValidationException("A patient with this email already exists");
        }
        return mapper.toResponse(repo.save(mapper.toEntity(req)));
    }

    @Transactional(readOnly = true)
    public PatientResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        return repo.findByIdAndTenantId(id, tenantId)
            .map(mapper::toResponse)
            .orElseThrow(() -> new NotFoundException("Patient not found"));
    }

    @Transactional
    public PatientResponse update(UUID id, PatientUpdateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        Patient patient = repo.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("Patient not found"));

        if (request.email() != null && !request.email().isBlank()
            && !Objects.equals(request.email(), patient.getEmail())
            && repo.existsByTenantIdAndEmailIgnoreCase(tenantId, request.email())) {
            throw new ValidationException("A patient with this email already exists");
        }

        if (request.firstName() != null) patient.setFirstName(request.firstName());
        if (request.lastName() != null) patient.setLastName(request.lastName());
        if (request.gender() != null) patient.setGender(request.gender());
        if (request.email() != null) patient.setEmail(request.email());
        if (request.phone() != null) patient.setPhone(request.phone());
        if (request.address() != null) patient.setAddress(request.address());
        return mapper.toResponse(patient);
    }

    @Transactional(readOnly = true)
    public PageResponse<PatientSummaryResponse> list(String query, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
        UUID tenantId = tenantRlsContext.apply();
        Page<Patient> patients = repo.searchByTenantId(
            tenantId,
            query == null ? "" : query.trim(),
            PageRequest.of(page, size, Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()))
        );
        List<PatientSummaryResponse> content = patients.getContent().stream()
            .map(mapper::toSummary)
            .toList();
        return new PageResponse<>(content, page, size, patients.getTotalElements());
    }
}