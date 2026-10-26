package health.caresync.common.tenant;
import org.springframework.data.jpa.domain.Specification;
import java.util.UUID;
public final class TenantSpecification {
    public static <T> Specification<T> of(UUID tenantId) {
        return (root, q, cb) -> cb.equal(root.get("tenantId"), tenantId);
    }
    private TenantSpecification() { }
}