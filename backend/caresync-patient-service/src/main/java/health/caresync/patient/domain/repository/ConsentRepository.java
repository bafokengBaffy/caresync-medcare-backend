package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.Consent;
import health.caresync.patient.domain.valueobject.ConsentStatus;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Consent data.
 */
@Repository
public interface ConsentRepository extends JpaRepository<Consent, UUID>, JpaSpecificationExecutor<Consent> {
    Optional<Consent> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);
    Optional<Consent> findByIdAndTenantIdAndPatientId(UUID id, UUID tenantId, UUID patientId);
    List<Consent> findAllByTenantIdAndPatientIdAndConsentTypeAndStatusOrderByGrantedAtDesc(
        UUID tenantId, UUID patientId, String consentType, ConsentStatus status
    );
    List<Consent> findAllByTenantIdAndStatusAndExpiresAtLessThan(
        UUID tenantId, ConsentStatus status, Instant expiresAt, Pageable pageable
    );
}
