package health.caresync.patient.storage;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
public class SupabaseStorageConfiguration {
    @Bean
    SupabaseStorageClient supabaseStorageClient(
        RestClient.Builder restClientBuilder,
        @Value("${caresync.storage.url}") String supabaseUrl,
        @Value("${caresync.storage.service-role-key}") String serviceRoleKey
    ) {
        String projectUrl = supabaseUrl.trim().replaceAll("/+$", "");
        if (projectUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new IllegalStateException(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when Supabase Storage is enabled"
            );
        }
        URI projectUri = URI.create(projectUrl);
        if (!"https".equalsIgnoreCase(projectUri.getScheme()) || projectUri.getHost() == null) {
            throw new IllegalStateException("SUPABASE_URL must be the HTTPS URL of the Supabase project");
        }
        RestClient restClient = restClientBuilder
            .baseUrl(projectUrl)
            .defaultHeader("apikey", serviceRoleKey)
            .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
            .build();
        return new SupabaseStorageClient(restClient, projectUrl);
    }
}
