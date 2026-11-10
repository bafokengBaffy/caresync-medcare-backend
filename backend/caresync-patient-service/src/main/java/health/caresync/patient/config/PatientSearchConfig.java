package health.caresync.patient.config;

import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Patient Search features.
 * OWASP Alignment: If using Elasticsearch or a similar search engine, 
 * this config ensures that search queries are properly sanitized and scoped by tenant.
 */
@Configuration
public class PatientSearchConfig {
    // Placeholder for future full-text search configuration (e.g., Hibernate Search, Elasticsearch)
}
