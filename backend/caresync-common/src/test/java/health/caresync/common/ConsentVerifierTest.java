package health.caresync.common;

import health.caresync.common.security.ConsentVerifier;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ConsentVerifierTest {

    @Test
    void default_deniesConsent() {
        ConsentVerifier v = new ConsentVerifier();
        assertThat(v.isGranted("p1", new String[]{"TREATMENT"})).isFalse();
    }
}