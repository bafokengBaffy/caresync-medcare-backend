package health.caresync.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/** Enables @Retryable with sensible defaults configured on annotations. */
@Configuration
@EnableRetry
public class RetryConfig {
}