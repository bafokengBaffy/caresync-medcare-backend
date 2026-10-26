package health.caresync.patient.storage;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
public class SupabaseStorageConfiguration {
    @Bean(destroyMethod = "close")
    S3Client supabaseS3Client(
        @Value("${caresync.storage.endpoint}") String endpoint,
        @Value("${caresync.storage.region:us-east-1}") String region,
        @Value("${caresync.storage.access-key}") String accessKey,
        @Value("${caresync.storage.secret-key}") String secretKey
    ) {
        if (endpoint.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new IllegalStateException(
                "SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY and SUPABASE_S3_SECRET_KEY are required when storage is enabled"
            );
        }
        return S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)
            ))
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
            .build();
    }
}
