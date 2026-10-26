package health.caresync.clinical.dto;

public record SoapDataResponse(
    String subjective,
    String objective,
    String assessment,
    String plan
) {
}
