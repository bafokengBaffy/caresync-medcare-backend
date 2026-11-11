package health.caresync.common.metrics;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("appHealthIndicator")
public class HealthCheckConfig implements HealthIndicator {
    @Override
    public Health health() { return Health.up().withDetail("app", "caresync").build(); }
}