package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.MedicalAidClaim;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicalAidClaimRepository extends JpaRepository<MedicalAidClaim, UUID> {
    Optional<MedicalAidClaim> findByIdAndTenantId(UUID id, UUID tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from MedicalAidClaim c where c.id = :id and c.tenantId = :tenantId")
    Optional<MedicalAidClaim> findByIdAndTenantIdForUpdate(
        @Param("id") UUID id,
        @Param("tenantId") UUID tenantId
    );

    List<MedicalAidClaim> findAllByTenantIdOrderBySubmittedAtDesc(UUID tenantId);
}