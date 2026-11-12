package health.caresync.common.metrics;

import io.micrometer.prometheus.PrometheusMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.autoconfigure.metrics.export.prometheus.PrometheusMetricsExportAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.autoconfigure.AutoConfigurations;

import static org.assertj.core.api.Assertions.assertThat;

class CareSyncPrometheusConfigurationTest {

    @Test
    void coexistsWithPrometheusExportAutoConfiguration() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(PrometheusMetricsExportAutoConfiguration.class))
                .withUserConfiguration(CareSyncPrometheusConfiguration.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBeansOfType(PrometheusMeterRegistry.class)).hasSize(1);
                });
    }
}
