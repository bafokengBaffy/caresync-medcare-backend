package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.dto.PatientSearchCriteria;
import health.caresync.patient.dto.PatientSearchResponse;
import health.caresync.patient.dto.PatientSummaryResponse;
import health.caresync.patient.mapper.PatientMapper;
import health.caresync.patient.service.PatientSearchService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class PatientSearchServiceTest {
    @Mock
    private PatientRepository repository;

    @Mock
    private PatientMapper mapper;

    @Mock
    private TenantRlsContext tenantContext;

    @Test
    void searchesWithinAuthenticatedTenantAndMapsResults() {
        UUID tenantId = UUID.randomUUID();
        Patient patient = new Patient();
        PatientSummaryResponse summary = new PatientSummaryResponse(
            UUID.randomUUID(), "Ari", "Khoali", null, null, null
        );
        when(tenantContext.apply()).thenReturn(tenantId);
        when(repository.searchByTenantId(eq(tenantId), eq("Ari"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(patient), PageRequest.of(0, 20), 1));
        when(mapper.toSummary(patient)).thenReturn(summary);

        PatientSearchResponse result = new PatientSearchService(repository, mapper, tenantContext)
            .search(tenantId, new PatientSearchCriteria("Ari", 0, 20));

        assertEquals(List.of(summary), result.results());
        assertEquals(1, result.total());
        verify(repository).searchByTenantId(eq(tenantId), eq("Ari"), any(Pageable.class));
    }

    @Test
    void rejectsTenantMismatchBeforeQueryingRepository() {
        UUID tenantId = UUID.randomUUID();
        when(tenantContext.apply()).thenReturn(UUID.randomUUID());

        assertThrows(
            ForbiddenException.class,
            () -> new PatientSearchService(repository, mapper, tenantContext)
                .search(tenantId, new PatientSearchCriteria("", 0, 20))
        );
        verifyNoInteractions(repository);
    }
}