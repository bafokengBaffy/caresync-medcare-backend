package health.caresync.patient.dto;

import java.time.LocalDate;

public record MergeFilter(String status, LocalDate from, LocalDate to) {
}
