package health.caresync.common;

import health.caresync.common.security.PermissionEvaluator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PermissionAspectTest {

    @Test
    void evaluator_grantsWhenPermissionPresent() {
        PermissionEvaluator eval = new PermissionEvaluator();
        assertThat(eval.hasPermission(List.of("read:patient"), "read:patient")).isTrue();
        assertThat(eval.hasPermission(List.of(), "read:patient")).isFalse();
        assertThat(eval.hasPermission(null, "read:patient")).isFalse();
    }
}