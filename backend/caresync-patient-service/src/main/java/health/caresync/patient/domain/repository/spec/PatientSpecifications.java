package health.caresync.patient.domain.repository.spec;
import health.caresync.patient.domain.entity.Patient;
import org.springframework.data.jpa.domain.Specification;
public final class PatientSpecifications {
    public static Specification<Patient> nameContains(String q) {
        return (r, cq, cb) -> q == null ? null : cb.or(
            cb.like(cb.lower(r.get("firstName")), "%" + q.toLowerCase() + "%"),
            cb.like(cb.lower(r.get("lastName")),  "%" + q.toLowerCase() + "%"));
    }
    private PatientSpecifications() { }
}