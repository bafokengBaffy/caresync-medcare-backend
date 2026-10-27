package health.caresync.patient.dto;

import java.util.List;

public record PatientSearchResponse(
    List<PatientSummaryResponse> results,
    int page,
    int size,
    long total
) { }