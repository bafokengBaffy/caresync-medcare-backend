package health.caresync.patient.storage;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

public class SupabaseStorageClient {
    private static final String OBJECT_ENDPOINT = "/storage/v1/object/";

    private final RestClient restClient;
    private final String supabaseUrl;

    SupabaseStorageClient(RestClient restClient, String supabaseUrl) {
        this.restClient = restClient;
        this.supabaseUrl = supabaseUrl.replaceAll("/+$", "");
    }

    public void upload(String bucket, String objectKey, String contentType, byte[] content) {
        restClient.post()
            .uri(objectUri(bucket, objectKey))
            .contentType(MediaType.parseMediaType(contentType))
            .header("x-upsert", "false")
            .body(content)
            .retrieve()
            .toBodilessEntity();
    }

    public StoredObject download(String bucket, String objectKey) {
        var response = restClient.get()
            .uri(objectUri(bucket, objectKey))
            .retrieve()
            .toEntity(byte[].class);
        byte[] content = response.getBody();
        if (content == null) {
            throw new IllegalStateException("Supabase Storage returned an empty document response");
        }
        MediaType contentType = response.getHeaders().getContentType();
        return new StoredObject(
            content,
            contentType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType.toString()
        );
    }

    public void delete(String bucket, String objectKey) {
        restClient.method(HttpMethod.DELETE)
            .uri(objectUri(bucket, ""))
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("prefixes", List.of(objectKey)))
            .retrieve()
            .toBodilessEntity();
    }

    private URI objectUri(String bucket, String objectKey) {
        String encodedBucket = UriUtils.encodePathSegment(bucket, StandardCharsets.UTF_8);
        String encodedKey = objectKey.isBlank()
            ? ""
            : Arrays.stream(objectKey.split("/"))
                .map(segment -> UriUtils.encodePathSegment(segment, StandardCharsets.UTF_8))
                .collect(Collectors.joining("/"));
        return URI.create(
            supabaseUrl + OBJECT_ENDPOINT + encodedBucket + (encodedKey.isEmpty() ? "" : "/" + encodedKey)
        );
    }

    public record StoredObject(byte[] content, String contentType) { }
}
