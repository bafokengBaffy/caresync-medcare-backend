package health.caresync.patient.storage;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentAccessLogRepository extends JpaRepository<DocumentAccessLog, UUID> { }