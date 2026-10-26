package health.caresync.gateway;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import health.caresync.gateway.config.RateLimitConfig;
import org.junit.jupiter.api.Test;

class RateLimitTest {
    @Test
    void enforcesConfiguredCapacityPerAddress() {
        RateLimitConfig config = new RateLimitConfig(2);

        assertTrue(config.bucketFor("192.0.2.1").tryConsume(1));
        assertTrue(config.bucketFor("192.0.2.1").tryConsume(1));
        assertFalse(config.bucketFor("192.0.2.1").tryConsume(1));
    }

    @Test
    void keepsAddressBucketsIndependent() {
        RateLimitConfig config = new RateLimitConfig(1);

        assertTrue(config.bucketFor("192.0.2.1").tryConsume(1));
        assertTrue(config.bucketFor("192.0.2.2").tryConsume(1));
    }
}