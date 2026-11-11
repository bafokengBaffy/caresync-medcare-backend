package health.caresync.patient.storage;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class SupabaseProfileImageStorageTest {
    private final SupabaseProfileImageStorage storage = new SupabaseProfileImageStorage(
        "https://project.supabase.co",
        "server-only-key",
        "caresync-bucket",
        true
    );

    @Test
    void rejectsUnsupportedContentTypes() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "avatar.svg", "image/svg+xml", "<svg/>".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> storage.upload("firebase-user", file));
    }

    @Test
    void rejectsFilesOverFiveMegabytes() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "avatar.png",
            "image/png",
            new byte[5 * 1024 * 1024 + 1]
        );

        assertThrows(IllegalArgumentException.class, () -> storage.upload("firebase-user", file));
    }

    @Test
    void rejectsImageDataWithAnInvalidSignature() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "avatar.png", "image/png", "not a png".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> storage.upload("firebase-user", file));
    }

    @Test
    void rejectsInvalidFirebaseIdentifiersBeforeBuildingStoragePaths() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "avatar.png", "image/png",
            new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}
        );

        assertThrows(IllegalArgumentException.class, () -> storage.upload("../other-user", file));
    }
}
