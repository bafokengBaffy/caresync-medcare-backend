package health.caresync.patient.domain.repository.spec;
import health.caresync.patient.domain.entity.Provider;
import org.springframework.data.jpa.domain.Specification;
public final class ProviderSpecifications {
    public static Specification<Provider> bySpecialty(String s) {
        return (r, cq, cb) -> s == null ? null : cb.equal(r.get("specialty"), s);
    }
    private ProviderSpecifications() { }
}