package health.caresync.common.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/** Named counters for business-critical events (OWASP A09 observability). */
@Component
public class BusinessMetrics {

    private final Counter invoicesIssued;
    private final Counter paymentsReceived;
    private final Counter consentDenied;

    public BusinessMetrics(MeterRegistry registry) {
        this.invoicesIssued = Counter.builder("caresync.invoices.issued")
                .description("Invoices issued").register(registry);
        this.paymentsReceived = Counter.builder("caresync.payments.received")
                .description("Payments received").register(registry);
        this.consentDenied = Counter.builder("caresync.consent.denied")
                .description("Consent denials").register(registry);
    }

    public void incrementInvoicesIssued() { invoicesIssued.increment(); }
    public void incrementPaymentsReceived() { paymentsReceived.increment(); }
    public void incrementConsentDenied() { consentDenied.increment(); }
}