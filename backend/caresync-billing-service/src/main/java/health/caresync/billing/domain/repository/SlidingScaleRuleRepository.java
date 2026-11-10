package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.SlidingScaleRule;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlidingScaleRuleRepository extends JpaRepository<SlidingScaleRule, UUID> {
    List<SlidingScaleRule> findAllByTenantIdOrderByMinimumAnnualIncomeCentsAsc(UUID tenantId);
    List<SlidingScaleRule> findAllByTenantIdAndActiveTrueOrderByMinimumAnnualIncomeCentsDesc(
        UUID tenantId
    );
}