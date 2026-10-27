package health.caresync.patient.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Component
@Validated
@ConfigurationProperties(prefix = "caresync.patient.search")
public class PatientSearchConfig {
    @Min(1)
    @Max(100)
    private int maxPageSize = 100;

    @Min(1)
    @Max(10000)
    private int duplicateScanLimit = 500;

    public int getMaxPageSize() { return maxPageSize; }
    public void setMaxPageSize(int maxPageSize) { this.maxPageSize = maxPageSize; }
    public int getDuplicateScanLimit() { return duplicateScanLimit; }
    public void setDuplicateScanLimit(int duplicateScanLimit) { this.duplicateScanLimit = duplicateScanLimit; }
}