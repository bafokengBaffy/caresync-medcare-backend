package health.caresync.patient.controller;

import health.caresync.common.annotation.AuditLog;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.service.AdminSubscriptionService;
import health.caresync.patient.service.AdminSubscriptionService.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/subscriptions")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminSubscriptionController {
    private final AdminSubscriptionService subscriptions;
    public AdminSubscriptionController(AdminSubscriptionService subscriptions) { this.subscriptions = subscriptions; }

    @GetMapping("/stats") public Stats stats() { return subscriptions.stats(); }
    @GetMapping("/plans") public List<Plan> plans() { return subscriptions.plans(); }
    @GetMapping public Page<Subscription> list(@RequestParam(required=false) String search,
        @RequestParam(required=false) String status,@RequestParam(required=false) String tier,@RequestParam(required=false) String interval,
        @RequestParam(defaultValue="1") @Min(1) int page,@RequestParam(defaultValue="10") @Min(1) @Max(100) int pageSize,
        @RequestParam(defaultValue="createdAt") String sortBy,@RequestParam(defaultValue="desc") String sortDir) {
        return subscriptions.list(search,status,tier,interval,page,pageSize,sortBy,sortDir);
    }
    @GetMapping("/{id}") public Subscription get(@PathVariable UUID id) { return subscriptions.get(id); }
    @GetMapping("/{id}/invoices") public Page<java.util.Map<String,Object>> invoices(@PathVariable UUID id,
        @RequestParam(defaultValue="1") @Min(1) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int pageSize) { return subscriptions.invoices(id,page,pageSize); }
    @GetMapping("/{id}/events") public List<Event> events(@PathVariable UUID id) { return subscriptions.events(id); }

    @PostMapping("/{id}/change-plan") @AuditLog(action="ADMIN_SUBSCRIPTION_PLAN_CHANGE",description="Changed platform subscription plan")
    public Subscription changePlan(@PathVariable UUID id,@Valid @RequestBody ChangePlanRequest r,@AuthenticationPrincipal CaresyncPrincipal actor) {
        return subscriptions.changePlan(id,r.planId(),r.prorate(),r.effectiveDate(),r.reason(),actor.userId(),actor.email());
    }
    @PostMapping("/{id}/seats") @AuditLog(action="ADMIN_SUBSCRIPTION_SEATS",description="Changed platform subscription seat allocation")
    public Subscription seats(@PathVariable UUID id,@Valid @RequestBody SeatsRequest r,@AuthenticationPrincipal CaresyncPrincipal actor) {
        return subscriptions.seats(id,r.seatsAllocated(),r.reason(),actor.userId(),actor.email());
    }
    @PostMapping("/{id}/cancel") @AuditLog(action="ADMIN_SUBSCRIPTION_CANCEL",description="Canceled platform subscription")
    public Subscription cancel(@PathVariable UUID id,@Valid @RequestBody CancelRequest r,@AuthenticationPrincipal CaresyncPrincipal actor) {
        return subscriptions.cancel(id,r.cancelAtPeriodEnd(),r.reason(),r.feedback(),actor.userId(),actor.email());
    }
    @PostMapping("/{id}/reactivate") @AuditLog(action="ADMIN_SUBSCRIPTION_REACTIVATE",description="Reactivated platform subscription")
    public Subscription reactivate(@PathVariable UUID id,@Valid @RequestBody ReasonRequest r,@AuthenticationPrincipal CaresyncPrincipal actor) {
        return subscriptions.reactivate(id,r.reason(),actor.userId(),actor.email());
    }
    @PostMapping("/{id}/extend-trial") @AuditLog(action="ADMIN_SUBSCRIPTION_TRIAL_EXTENSION",description="Extended platform subscription trial")
    public Subscription extend(@PathVariable UUID id,@Valid @RequestBody TrialRequest r,@AuthenticationPrincipal CaresyncPrincipal actor) {
        return subscriptions.extendTrial(id,r.additionalDays(),r.reason(),actor.userId(),actor.email());
    }
    @PostMapping("/{id}/coupons") @AuditLog(action="ADMIN_SUBSCRIPTION_COUPON",description="Recorded platform subscription coupon code")
    public Subscription coupon(@PathVariable UUID id,@Valid @RequestBody CouponRequest r,@AuthenticationPrincipal CaresyncPrincipal actor) {
        return subscriptions.coupon(id,r.couponCode(),actor.userId(),actor.email());
    }

    public record ChangePlanRequest(@NotBlank @Size(max=64) String planId,@NotBlank @Pattern(regexp="immediate|next_period") String effectiveDate,boolean prorate,@NotBlank @Size(min=3,max=500) String reason) { }
    public record SeatsRequest(@Min(1) @Max(100000) int seatsAllocated,@NotBlank @Size(min=3,max=500) String reason) { }
    public record CancelRequest(boolean cancelAtPeriodEnd,@NotBlank @Size(min=3,max=500) String reason,@Size(max=500) String feedback) { }
    public record ReasonRequest(@NotBlank @Size(min=3,max=500) String reason) { }
    public record TrialRequest(@Min(1) @Max(60) int additionalDays,@NotBlank @Size(min=3,max=500) String reason) { }
    public record CouponRequest(@NotBlank @Pattern(regexp="[A-Z0-9_-]{3,40}") String couponCode) { }
}
