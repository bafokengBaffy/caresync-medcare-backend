package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.Consent;
import health.caresync.patient.domain.valueobject.ConsentStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ConsentRepository extends JpaRepository<Consent, UUID>, JpaSpecificationExecutor<Consent> {
    Optional<Consent> findByIdAndTenantIdAndPatientId(UUID id, UUID tenantId, UUID patientId);

    Optional<Consent> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

    List<Consent> findAllByTenantIdAndPatientIdAndConsentTypeAndStatusOrderByGrantedAtDesc(
        UUID tenantId,
        UUID patientId,
        String consentType,
        ConsentStatus status
    );

    List<Consent> findAllByTenantIdAndStatusAndExpiresAtLessThan(
        UUID tenantId,
        ConsentStatus status,
        Instant before,
        Pageable pageable
    );
}