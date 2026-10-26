package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.NotFoundException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.mapper.PatientMapper;
import health.caresync.patient.service.PatientService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PatientServiceTest {
    @Test
    void patientLookupAlwaysIncludesAuthenticatedTenant() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        PatientRepository repository = org.mockito.Mockito.mock(PatientRepository.class);
        TenantRlsContext tenantContext = org.mockito.Mockito.mock(TenantRlsContext.class);
        when(tenantContext.apply()).thenReturn(tenantId);
        when(repository.findByIdAndTenantId(patientId, tenantId)).thenReturn(Optional.empty());
        PatientService service = new PatientService(
            repository, org.mockito.Mockito.mock(PatientMapper.class), tenantContext
        );

        assertThrows(NotFoundException.class, () -> service.get(patientId));
        verify(repository).findByIdAndTenantId(patientId, tenantId);
    }
}