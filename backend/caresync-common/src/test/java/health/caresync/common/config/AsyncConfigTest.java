package health.caresync.common.config;

import java.util.concurrent.Executor;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class AsyncConfigTest {

    @Test
    void registersBoundedExecutorWithoutReplacingExistingTaskExecutor() {
        new ApplicationContextRunner()
                .withBean("taskExecutor", Executor.class, () -> Runnable::run)
                .withUserConfiguration(AsyncConfig.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasBean("taskExecutor");
                    assertThat(context).hasBean("caresyncTaskExecutor");
                });
    }
}
