package health.caresync.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMQConfigTest {

    @Test
    void placeholder() {
        // Rabbit topology is defined per service; this test guards the module dependency only.
        assertThat(true).isTrue();
    }
}