package health.caresync.patient.storage;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class SupabaseStorageClientTest {
    private static final String PROJECT_URL = "https://project.supabase.co";
    private static final String OBJECT_KEY = "tenant/patients/patient/documents/document";
    private static final String OBJECT_URL =
        PROJECT_URL + "/storage/v1/object/caresync-bucket/" + OBJECT_KEY;

    @Test
    void performsPrivateObjectUploadDownloadAndDeleteRequests() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        SupabaseStorageClient client = new SupabaseStorageClient(builder.build(), PROJECT_URL);

        server.expect(requestTo(OBJECT_URL))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("x-upsert", "false"))
            .andRespond(withSuccess());
        server.expect(requestTo(OBJECT_URL))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess(new byte[] {1, 2, 3}, MediaType.APPLICATION_PDF));
        server.expect(requestTo(PROJECT_URL + "/storage/v1/object/caresync-bucket"))
            .andExpect(method(HttpMethod.DELETE))
            .andExpect(content().json("{\"prefixes\":[\"" + OBJECT_KEY + "\"]}"))
            .andRespond(withSuccess());

        client.upload("caresync-bucket", OBJECT_KEY, MediaType.APPLICATION_PDF_VALUE, new byte[] {1});
        SupabaseStorageClient.StoredObject storedObject = client.download("caresync-bucket", OBJECT_KEY);
        client.delete("caresync-bucket", OBJECT_KEY);

        assertArrayEquals(new byte[] {1, 2, 3}, storedObject.content());
        assertEquals(MediaType.APPLICATION_PDF_VALUE, storedObject.contentType());
        server.verify();
    }
}
