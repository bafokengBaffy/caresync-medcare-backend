package health.caresync.patient.dto;

import java.time.LocalDate;

public record BulkOperationResponse(int affectedCount, LocalDate asOf) {
}
