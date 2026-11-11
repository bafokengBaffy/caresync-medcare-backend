package health.caresync.billing;

import health.caresync.billing.config.PackageBillingConfig;
import health.caresync.billing.domain.entity.PackageBilling;
import health.caresync.billing.domain.enums.DiscountType;
import health.caresync.billing.domain.enums.PaymentRoute;
import health.caresync.billing.domain.repository.PackageBillingRepository;
import health.caresync.billing.dto.PackageBillingRequest;
import health.caresync.billing.dto.PackageBillingResponse;
import health.caresync.billing.mapper.PackageBillingMapper;
import health.caresync.billing.service.PackageBillingService;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class PackageBillingServiceTest {

    private PackageBillingRepository repository;
    private PackageBillingService service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(PackageBillingRepository.class);
        PackageBillingConfig cfg = new PackageBillingConfig();
        cfg.setMaxDiscountFraction(new BigDecimal("0.30"));
        cfg.setMaxPackagePrice(new BigDecimal("1000000.00"));
        service = new PackageBillingService(repository, new PackageBillingMapper(), cfg);
        TenantContext.setTenantId("tenant-B");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_rejectsDiscountExceedingCap() {
        PackageBillingRequest req = new PackageBillingRequest(
                "patient-1", "PKG_DENTAL_1",
                new BigDecimal("1000.00"),
                new BigDecimal("400.00"),   // 40% > 30% cap
                DiscountType.PERCENTAGE,
                PaymentRoute.PRIVATE,
                5);
        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void create_persistsNetPrice() {
        when(repository.save(any(PackageBilling.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        PackageBillingRequest req = new PackageBillingRequest(
                "patient-1", "PKG_DENTAL_1",
                new BigDecimal("1000.00"),
                new BigDecimal("100.00"),
                DiscountType.FIXED_AMOUNT,
                PaymentRoute.PRIVATE,
                5);

        PackageBillingResponse resp = service.create(req);
        assertThat(resp.netPrice()).isEqualByComparingTo("900.00");
        assertThat(resp.tenantId()).isEqualTo("tenant-B");
        assertThat(resp.usedSessions()).isZero();
    }

    @Test
    void redeem_transitionsToExhausted() {
        PackageBilling entity = new PackageBilling("tenant-B", "patient-1", "PKG",
                new BigDecimal("100.00"), BigDecimal.ZERO, DiscountType.NONE,
                new BigDecimal("100.00"), PaymentRoute.PRIVATE, 1);
        when(repository.findByIdAndTenantId("id-1", "tenant-B")).thenReturn(java.util.Optional.of(entity));
        when(repository.save(any(PackageBilling.class))).thenAnswer(inv -> inv.getArgument(0));

        PackageBillingResponse resp = service.redeem("id-1");
        assertThat(resp.usedSessions()).isEqualTo(1);
        assertThat(resp.status()).isEqualTo("EXHAUSTED");
    }

    @Test
    void get_rejectsCrossTenant() {
        when(repository.findByIdAndTenantId("id-2", "tenant-B"))
                .thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.get("id-2"))
                .isInstanceOf(RuntimeException.class);
    }
}