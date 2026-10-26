package health.caresync.clinical.notes;

import java.util.Map;

public interface ClinicalNoteStore {
    String create(Map<String, Object> note);
    Map<String, Object> findById(String id);
}
