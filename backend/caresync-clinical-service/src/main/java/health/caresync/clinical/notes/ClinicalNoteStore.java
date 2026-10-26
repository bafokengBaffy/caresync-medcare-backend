package health.caresync.clinical.notes;

import java.util.Map;
import java.util.List;

public interface ClinicalNoteStore {
    String create(Map<String, Object> note);
    Map<String, Object> findById(String id);
    List<Map<String, Object>> findByTenantId(String tenantId);
}
