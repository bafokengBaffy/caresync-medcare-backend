package health.caresync.billing.domain.repository;
import health.caresync.billing.domain.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.UUID;
public interface PatientInvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByPatientId(String patientId);
}
