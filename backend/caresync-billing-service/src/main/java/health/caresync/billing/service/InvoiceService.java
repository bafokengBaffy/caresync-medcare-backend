package health.caresync.billing.service;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceLineItem;
import health.caresync.billing.domain.InvoiceLineItemRepository;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.ServiceFee;
import health.caresync.billing.domain.ServiceFeeRepository;
import health.caresync.billing.dto.BillingSummaryResponse;
import health.caresync.billing.dto.InvoiceCreateRequest;
import health.caresync.billing.dto.InvoiceItemRequest;
import health.caresync.billing.dto.InvoiceLineResponse;
import health.caresync.billing.dto.InvoiceResponse;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {
    private final InvoiceRepository invoices;
    private final InvoiceLineItemRepository lineItems;
    private final ServiceFeeRepository fees;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;

    public InvoiceService(
        InvoiceRepository invoices,
        InvoiceLineItemRepository lineItems,
        ServiceFeeRepository fees,
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext
    ) {
        this.invoices = invoices;
        this.lineItems = lineItems;
        this.fees = fees;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public InvoiceResponse create(InvoiceCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        requirePatient(tenantId, request.patientId());
        requireCompletedAppointment(tenantId, request.patientId(), request.appointmentId());

        List<ServiceFee> selectedFees = new ArrayList<>();
        long total = 0;
        String currency = null;
        try {
            for (InvoiceItemRequest item : request.items()) {
                ServiceFee fee = fees.findByTenantIdAndCodeAndActiveTrue(tenantId, item.code())
                    .orElseThrow(() -> new NotFoundException("Active service fee not found"));
                if (currency != null && !currency.equals(fee.getCurrency())) {
                    throw new ValidationException("An invoice cannot mix currencies");
                }
                currency = fee.getCurrency();
                total = Math.addExact(total, Math.multiplyExact(fee.getUnitPriceCents(), item.quantity()));
                selectedFees.add(fee);
            }
        } catch (ArithmeticException e) {
            throw new ValidationException("Invoice total exceeds the supported amount");
        }

        Invoice invoice = new Invoice();
        invoice.setTenantId(tenantId);
        invoice.setPatientId(request.patientId());
        invoice.setAppointmentId(request.appointmentId());
        invoice.setAmountCents(total);
        invoice.setCurrency(currency);
        invoice.setStatus(InvoiceStatus.ISSUED);
        invoice.setIssuedAt(Instant.now());
        invoice.setInvoiceNumber("INV-" + UUID.randomUUID().toString().replace("-", "").toUpperCase());
        invoice = invoices.saveAndFlush(invoice);

        List<InvoiceLineItem> savedItems = new ArrayList<>();
        for (int index = 0; index < request.items().size(); index++) {
            InvoiceItemRequest requested = request.items().get(index);
            ServiceFee fee = selectedFees.get(index);
            InvoiceLineItem item = new InvoiceLineItem();
            item.setTenantId(tenantId);
            item.setInvoiceId(invoice.getId());
            item.setFeeId(fee.getId());
            item.setCode(fee.getCode());
            item.setDescription(fee.getDescription());
            item.setQuantity(requested.quantity());
            item.setUnitPriceCents(fee.getUnitPriceCents());
            savedItems.add(lineItems.save(item));
        }
        writeAudit(tenantId, "INVOICE_CREATED", invoice.getId().toString());
        return response(invoice, savedItems);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        Invoice invoice = invoices.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("Invoice not found"));
        return response(invoice, lineItems.findAllByTenantIdAndInvoiceId(tenantId, id));
    }

    @Transactional(readOnly = true)
    public BillingSummaryResponse summary() {
        UUID tenantId = tenantRlsContext.apply();
        Long totalInvoiced = jdbcTemplate.queryForObject(
            "select coalesce(sum(amount_cents), 0) from invoices where tenant_id = ? and status <> 'VOID'",
            Long.class,
            tenantId
        );
        Long totalPaid = jdbcTemplate.queryForObject(
            "select coalesce(sum(amount_cents), 0) from payments where tenant_id = ? and status = 'RECORDED'",
            Long.class,
            tenantId
        );
        return new BillingSummaryResponse(
            Math.max(0, totalInvoiced - totalPaid),
            totalPaid
        );
    }

    private void requirePatient(UUID tenantId, UUID patientId) {
        Boolean exists = jdbcTemplate.queryForObject(
            "select exists(select 1 from patients where tenant_id = ? and id = ?)",
            Boolean.class,
            tenantId,
            patientId
        );
        if (!Boolean.TRUE.equals(exists)) {
            throw new NotFoundException("Patient not found");
        }
    }

    private void requireCompletedAppointment(UUID tenantId, UUID patientId, UUID appointmentId) {
        Boolean completed = jdbcTemplate.query(
            "select patient_id = ? and status = 'COMPLETED' from appointments where tenant_id = ? and id = ?",
            resultSet -> resultSet.next() && resultSet.getBoolean(1),
            patientId,
            tenantId,
            appointmentId
        );
        if (!Boolean.TRUE.equals(completed)) {
            throw new ValidationException("Invoices require a completed appointment for this patient");
        }
    }

    private void writeAudit(UUID tenantId, String action, String resourceId) {
        jdbcTemplate.update(
            """
            insert into audit_logs (tenant_id, action, resource_type, resource_id)
            values (?, ?, 'invoice', ?)
            """,
            tenantId,
            action,
            resourceId
        );
    }

    static InvoiceResponse response(Invoice invoice, List<InvoiceLineItem> items) {
        List<InvoiceLineResponse> lineResponses = items.stream()
            .map(item -> new InvoiceLineResponse(
                item.getCode(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnitPriceCents(),
                Math.multiplyExact((long) item.getQuantity(), item.getUnitPriceCents())
            ))
            .toList();
        return new InvoiceResponse(
            invoice.getId(),
            invoice.getInvoiceNumber(),
            invoice.getPatientId(),
            invoice.getAppointmentId(),
            invoice.getAmountCents(),
            invoice.getCurrency(),
            invoice.getStatus(),
            invoice.getIssuedAt(),
            lineResponses
        );
    }
}
