package health.caresync.patient.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * JPA Configuration.
 * OWASP Alignment: Ensures transaction management is enabled, preventing partial data writes
 * that could leave the system in an inconsistent or insecure state.
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = "health.caresync.patient.domain.repository")
public class JpaConfig {
}
