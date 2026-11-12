package health.caresync.billing.service;
import health.caresync.billing.domain.entity.Invoice;
import health.caresync.billing.domain.repository.PatientInvoiceRepository;
import health.caresync.common.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal; import java.util.List; import java.util.UUID;
@Service
public class InvoiceService {
    private final PatientInvoiceRepository repository;
    public InvoiceService(PatientInvoiceRepository repository) { this.repository = repository; }
    @Transactional
    public Invoice createInvoice(String patientId, BigDecimal amount) {
        Invoice inv = new Invoice();
        inv.setPatientId(patientId);
        inv.setTotalAmount(amount);
        inv.setStatus("ISSUED");
        return repository.save(inv);
    }
    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesForPatient(String patientId) {
        return repository.findByPatientId(patientId);
    }
    @Transactional
    public Invoice markAsPaid(UUID id) {
        Invoice inv = repository.findById(id).orElseThrow(() -> new NotFoundException("Invoice", "id", id));
        inv.setStatus("PAID");
        return repository.save(inv);
    }
}
