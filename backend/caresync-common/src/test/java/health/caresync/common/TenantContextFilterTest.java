package health.caresync.common;

import health.caresync.common.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TenantContextFilterTest {

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void setAndClear() {
        TenantContext.setTenantId("t-1");
        assertThat(TenantContext.getTenantId()).isEqualTo("t-1");
        TenantContext.clear();
        assertThat(TenantContext.getTenantId()).isNull();
    }
}