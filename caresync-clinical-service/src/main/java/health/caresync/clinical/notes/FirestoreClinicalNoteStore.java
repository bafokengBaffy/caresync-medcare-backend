package health.caresync.clinical.notes;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Configuration
@ConditionalOnProperty(name = "caresync.firestore.enabled", havingValue = "true")
class FirestoreClinicalNoteConfiguration {
    @Bean
    Firestore firestore() {
        return FirestoreClient.getFirestore();
    }
}

@Component
@ConditionalOnProperty(name = "caresync.firestore.enabled", havingValue = "true")
class FirestoreClinicalNoteStore implements ClinicalNoteStore {
    private static final String COLLECTION = "clinical_notes";
    private final Firestore firestore;

    FirestoreClinicalNoteStore(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public String create(Map<String, Object> note) {
        var document = firestore.collection(COLLECTION).document();
        try {
            document.create(note).get();
            return document.getId();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Clinical note write was interrupted", e);
        } catch (ExecutionException e) {
            throw new IllegalStateException("Clinical note could not be stored", e.getCause());
        }
    }

    @Override
    public Map<String, Object> findById(String id) {
        try {
            var snapshot = firestore.collection(COLLECTION).document(id).get().get();
            return snapshot.exists() ? snapshot.getData() : null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Clinical note read was interrupted", e);
        } catch (ExecutionException e) {
            throw new IllegalStateException("Clinical note could not be retrieved", e.getCause());
        }
    }

    @Override
    public List<Map<String, Object>> findByTenantId(String tenantId) {
        try {
            var snapshots = firestore.collection(COLLECTION)
                .whereEqualTo("tenant_id", tenantId)
                .get()
                .get();
            List<Map<String, Object>> notes = new ArrayList<>(snapshots.size());
            for (var snapshot : snapshots.getDocuments()) {
                Map<String, Object> note = new HashMap<>(snapshot.getData());
                note.put("id", snapshot.getId());
                notes.add(note);
            }
            return notes;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Clinical note list read was interrupted", e);
        } catch (ExecutionException e) {
            throw new IllegalStateException("Clinical notes could not be listed", e.getCause());
        }
    }
}
