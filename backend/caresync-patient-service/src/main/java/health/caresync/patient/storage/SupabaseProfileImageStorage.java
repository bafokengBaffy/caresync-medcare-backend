package health.caresync.patient.storage;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupabaseProfileImageStorage {
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final long MAX_PIXELS = 20_000_000;

    private final String baseUrl;
    private final String serviceRoleKey;
    private final String bucket;
    private final boolean enabled;
    private final RestClient restClient;

    public SupabaseProfileImageStorage(
        @Value("${caresync.storage.url:}") String baseUrl,
        @Value("${caresync.storage.service-role-key:}") String serviceRoleKey,
        @Value("${caresync.storage.profile-image-bucket:caresync bucket}") String bucket,
        @Value("${caresync.storage.enabled:false}") boolean enabled
    ) {
        this.baseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
        this.serviceRoleKey = serviceRoleKey;
        this.bucket = bucket;
        this.enabled = enabled;
        this.restClient = RestClient.builder().build();
    }

    public StoredImage upload(String firebaseUid, MultipartFile file) {
        requireConfigured();
        if (firebaseUid == null || !firebaseUid.matches("[A-Za-z0-9._:-]{1,128}")) {
            throw new IllegalArgumentException("Invalid user identifier");
        }
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Choose a non-empty image no larger than 5 MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        ImageFormat format = ImageFormat.forContentType(contentType);
        if (format == null) throw new IllegalArgumentException("Only JPEG, PNG, and WebP images are supported");

        final byte[] original;
        try {
            original = file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("The selected image could not be read", exception);
        }
        if (!format.matches(original)) {
            throw new IllegalArgumentException("The selected file contents do not match its image type");
        }

        byte[] sanitized = format == ImageFormat.WEBP ? original : stripMetadata(original, format);
        if (sanitized.length == 0 || sanitized.length > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("The processed image exceeds the 5 MB limit");
        }
        String path = firebaseUid + "/" + UUID.randomUUID() + "." + format.extension;
        URI uri = URI.create(baseUrl + "/storage/v1/object/" + encodePath(bucket) + "/" + encodePath(path));
        try {
            restClient.put()
                .uri(uri)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("x-upsert", "false")
                .contentType(MediaType.parseMediaType(contentType))
                .body(sanitized)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException(
                "Supabase rejected the profile image upload (HTTP " + exception.getStatusCode().value() + ")",
                exception
            );
        }
        String publicUrl = baseUrl + "/storage/v1/object/public/"
            + encodePath(bucket) + "/" + encodePath(path);
        return new StoredImage(publicUrl, path, contentType);
    }

    public void delete(String objectPath) {
        requireConfigured();
        URI uri = URI.create(baseUrl + "/storage/v1/object/" + encodePath(bucket));
        restClient.method(HttpMethod.DELETE)
            .uri(uri)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("prefixes", List.of(objectPath)))
            .retrieve()
            .toBodilessEntity();
    }

    private void requireConfigured() {
        if (!enabled || baseUrl.isBlank() || serviceRoleKey == null
            || serviceRoleKey.isBlank() || bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("Profile image storage is not configured");
        }
    }

    private static byte[] stripMetadata(byte[] source, ImageFormat format) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(source))) {
            if (input == null) throw new IllegalArgumentException("Unsupported image data");
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("Unsupported image data");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS) {
                    throw new IllegalArgumentException("Image dimensions exceed the supported limit");
                }
                BufferedImage image = reader.read(0);
                if (image == null) throw new IllegalArgumentException("Unsupported image data");
                try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    if (!ImageIO.write(image, format.imageIoFormat, output)) {
                        throw new IllegalArgumentException("The image could not be safely processed");
                    }
                    return output.toByteArray();
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("The image could not be safely processed", exception);
        }
    }

    private static String encodePath(String path) {
        return URLEncoder.encode(path, StandardCharsets.UTF_8).replace("+", "%20").replace("%2F", "/");
    }

    public record StoredImage(String publicUrl, String objectPath, String contentType) { }

    private enum ImageFormat {
        JPEG("image/jpeg", "jpg", "jpeg"),
        PNG("image/png", "png", "png"),
        WEBP("image/webp", "webp", null);

        private final String contentType;
        private final String extension;
        private final String imageIoFormat;

        ImageFormat(String contentType, String extension, String imageIoFormat) {
            this.contentType = contentType;
            this.extension = extension;
            this.imageIoFormat = imageIoFormat;
        }

        static ImageFormat forContentType(String contentType) {
            for (ImageFormat value : values()) {
                if (value.contentType.equals(contentType)) return value;
            }
            return null;
        }

        boolean matches(byte[] bytes) {
            return switch (this) {
                case JPEG -> bytes.length >= 3
                    && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
                case PNG -> bytes.length >= 8
                    && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
                    && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
                case WEBP -> bytes.length >= 12
                    && bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46
                    && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50;
            };
        }
    }
}
