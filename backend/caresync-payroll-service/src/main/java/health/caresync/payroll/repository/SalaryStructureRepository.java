package health.caresync.payroll.repository;

import health.caresync.payroll.domain.SalaryStructure;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, UUID> {
    @Query("""
        select s from SalaryStructure s
        where s.tenantId = :tenantId
          and s.employeeId = :employeeId
          and s.active = true
          and s.effectiveFrom <= :effectiveOn
          and (s.effectiveTo is null or s.effectiveTo >= :effectiveOn)
        order by s.effectiveFrom desc
        """)
    Optional<SalaryStructure> findCurrentForEmployee(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId,
        @Param("effectiveOn") LocalDate effectiveOn
    );
}
