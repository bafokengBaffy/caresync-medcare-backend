package health.caresync.patient.storage;

import health.caresync.common.security.TenantContext;
import health.caresync.common.exception.ValidationException;
import health.caresync.patient.service.PatientService;
import java.io.IOException;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@ConditionalOnProperty(name = "caresync.storage.enabled", havingValue = "true")
public class PatientDocumentStorageService {
    private static final long MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

    private final S3Client s3Client;
    private final String bucket;
    private final PatientService patientService;

    public PatientDocumentStorageService(
        S3Client s3Client,
        @Value("${caresync.storage.bucket:caresync bucket}") String supabaseStorageBucket,
        PatientService patientService
    ) {
        this.s3Client = s3Client;
        this.bucket = supabaseStorageBucket;
        this.patientService = patientService;
    }

    public UUID upload(UUID patientId, MultipartFile file) throws IOException {
        patientService.get(patientId);
        if (file.isEmpty() || file.getSize() > MAX_DOCUMENT_BYTES) {
            throw new ValidationException("Document must be non-empty and no larger than 10 MiB");
        }
        UUID objectId = UUID.randomUUID();
        String key = objectKey(patientId, objectId);
        String contentType = file.getContentType();
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType == null ? "application/octet-stream" : contentType)
                .build(),
            RequestBody.fromBytes(file.getBytes())
        );
        return objectId;
    }

    public StoredDocument download(UUID patientId, UUID objectId) throws IOException {
        patientService.get(patientId);
        try (ResponseInputStream<GetObjectResponse> response = s3Client.getObject(
            GetObjectRequest.builder().bucket(bucket).key(objectKey(patientId, objectId)).build()
        )) {
            return new StoredDocument(response.readAllBytes(), response.response().contentType());
        }
    }

    private static String objectKey(UUID patientId, UUID objectId) {
        return TenantContext.require() + "/patients/" + patientId + "/" + objectId;
    }

    public record StoredDocument(byte[] content, String contentType) { }
}
