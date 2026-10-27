package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.dto.PatientSearchCriteria;
import health.caresync.patient.dto.PatientSearchResponse;
import health.caresync.patient.mapper.PatientMapper;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientSearchService {
    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final TenantRlsContext tenantRlsContext;

    public PatientSearchService(
        PatientRepository patientRepository,
        PatientMapper patientMapper,
        TenantRlsContext tenantRlsContext
    ) {
        this.patientRepository = patientRepository;
        this.patientMapper = patientMapper;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public PatientSearchResponse search(UUID tenantId, PatientSearchCriteria criteria) {
        UUID authenticatedTenantId = tenantRlsContext.apply();
        if (!Objects.equals(tenantId, authenticatedTenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        if (criteria == null || criteria.page() < 0 || criteria.size() < 1 || criteria.size() > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }

        Page<Patient> page = patientRepository.searchByTenantId(
            tenantId,
            criteria.query() == null ? "" : criteria.query().trim(),
            PageRequest.of(
                criteria.page(),
                criteria.size(),
                Sort.by("lastName").ascending().and(Sort.by("firstName").ascending())
            )
        );
        return new PatientSearchResponse(
            page.getContent().stream().map(patientMapper::toSummary).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }
}