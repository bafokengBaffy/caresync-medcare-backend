package health.caresync.laboratory.service;
import health.caresync.common.exception.NotFoundException;
import health.caresync.laboratory.domain.entity.LabResult;
import health.caresync.laboratory.domain.repository.LabResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List; import java.util.UUID;
@Service
public class LabResultService {
    private final LabResultRepository repository;
    public LabResultService(LabResultRepository repository) { this.repository = repository; }
    @Transactional
    public LabResult createResult(String patientId, String testName) {
        LabResult res = new LabResult();
        res.setPatientId(patientId);
        res.setTestName(testName);
        res.setStatus("PENDING");
        return repository.save(res);
    }
    @Transactional
    public LabResult completeResult(UUID id, String resultValue) {
        LabResult res = repository.findById(id).orElseThrow(() -> new NotFoundException("LabResult", "id", id));
        res.setResultValue(resultValue);
        res.setStatus("COMPLETED");
        return repository.save(res);
    }
    @Transactional(readOnly = true)
    public List<LabResult> getResultsForPatient(String patientId) {
        return repository.findByPatientId(patientId);
    }
}
