package health.caresync.patient.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Platform subscription administration. All mutation inputs are validated here as well as at HTTP binding. */
@Service
public class AdminSubscriptionService {
    private static final Pattern COUPON = Pattern.compile("[A-Z0-9_-]{3,40}");
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public AdminSubscriptionService(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc = jdbc; this.mapper = mapper; }

    public List<Plan> plans() {
        return jdbc.query("SELECT *,billing_interval AS interval FROM subscription_plans WHERE active=true ORDER BY amount_minor", (rs, n) -> new Plan(
            rs.getString("code"), rs.getString("code"), rs.getString("name"), rs.getString("tier"), rs.getString("description"),
            rs.getString("currency"), rs.getLong("amount_minor"), rs.getString("interval"), rs.getInt("trial_days"),
            (Integer) rs.getObject("seat_limit"), readFeatures(rs.getString("features")), rs.getBoolean("active"),
            instant(rs.getTimestamp("created_at")), instant(rs.getTimestamp("updated_at"))));
    }

    public Stats stats() {
        return jdbc.queryForObject("""
            SELECT COUNT(*) total, COUNT(*) FILTER (WHERE s.status='active') active,
              COUNT(*) FILTER (WHERE s.status='trialing') trialing,
              COUNT(*) FILTER (WHERE s.status='past_due') past_due,
              COUNT(*) FILTER (WHERE s.status='canceled') canceled,
              COALESCE(SUM(CASE p.billing_interval WHEN 'annual' THEN p.amount_minor/12 WHEN 'quarterly' THEN p.amount_minor/3 ELSE p.amount_minor END) FILTER (WHERE s.status IN ('active','trialing')),0) mrr
            FROM tenant_subscriptions s JOIN subscription_plans p ON p.code=s.plan_code
            """, (rs, n) -> {
                long active = rs.getLong("active"), total = rs.getLong("total"), canceled = rs.getLong("canceled");
                return new Stats(total, active, rs.getLong("trialing"), rs.getLong("past_due"), canceled,
                    rs.getLong("mrr"), rs.getLong("mrr") * 12, total == 0 ? 0d : Math.round(canceled * 10000d / total) / 100d, "ZAR");
            });
    }

    public Page<Subscription> list(String search, String status, String tier, String interval, int page, int pageSize, String sortBy, String sortDir) {
        page = Math.max(1, page); pageSize = Math.min(100, Math.max(1, pageSize));
        if (sortBy != null && !List.of("tenant", "status", "mrr", "currentPeriodEnd", "createdAt").contains(sortBy)) throw bad("Unsupported sort field");
        if (sortDir != null && !List.of("asc", "desc").contains(sortDir.toLowerCase(Locale.ROOT))) throw bad("Unsupported sort direction");
        String order = switch (sortBy == null ? "createdAt" : sortBy) {
            case "tenant" -> "t.name"; case "status" -> "s.status"; case "mrr" -> "p.amount_minor";
            case "currentPeriodEnd" -> "s.current_period_end"; default -> "s.created_at";
        };
        String direction = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        java.util.ArrayList<Object> args = new java.util.ArrayList<>();
        if (search != null && search.length() > 120) throw bad("Search text is too long");
        if (search != null && !search.isBlank()) { where.append("AND (lower(t.name) LIKE ? OR lower(t.subdomain) LIKE ?) "); String q = "%" + search.trim().toLowerCase(Locale.ROOT) + "%"; args.add(q); args.add(q); }
        if (validFilter(status, List.of("trialing","active","past_due","paused","canceled","expired","suspended"))) { where.append("AND s.status=? "); args.add(status.toLowerCase(Locale.ROOT)); }
        else if (status != null && !status.isBlank() && !status.equalsIgnoreCase("all")) throw bad("Unsupported subscription status filter");
        if (validFilter(tier, List.of("starter","professional","enterprise","custom"))) { where.append("AND p.tier=? "); args.add(tier.toLowerCase(Locale.ROOT)); }
        else if (tier != null && !tier.isBlank() && !tier.equalsIgnoreCase("all")) throw bad("Unsupported subscription tier filter");
        if (validFilter(interval, List.of("monthly","quarterly","annual"))) { where.append("AND p.billing_interval=? "); args.add(interval.toLowerCase(Locale.ROOT)); }
        else if (interval != null && !interval.isBlank() && !interval.equalsIgnoreCase("all")) throw bad("Unsupported billing interval filter");
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM tenant_subscriptions s JOIN tenants t ON t.id=s.tenant_id JOIN subscription_plans p ON p.code=s.plan_code" + where, Long.class, args.toArray());
        args.add(pageSize); args.add((page - 1) * pageSize);
        List<Subscription> rows = jdbc.query(baseSelect() + where + " ORDER BY " + order + " " + direction + " LIMIT ? OFFSET ?", this::mapSubscription, args.toArray());
        long count = total == null ? 0 : total;
        return new Page<>(rows, count, page, pageSize, (int) Math.ceil(count / (double) pageSize));
    }

    public Subscription get(UUID id) { return one(id); }
    public Page<Map<String,Object>> invoices(UUID id, int page, int size) {
        one(id);
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
            "Subscription invoice history is unavailable until a billing provider is connected");
    }
    public List<Event> events(UUID id) {
        one(id);
        return jdbc.query("SELECT * FROM subscription_events WHERE subscription_id=? ORDER BY occurred_at DESC LIMIT 100", (rs,n) ->
            new Event(rs.getObject("id").toString(), id.toString(), rs.getString("actor_id"), rs.getString("actor_name"), rs.getString("action"), rs.getString("description"), Map.of(), rs.getTimestamp("occurred_at").toInstant()), id);
    }

    @Transactional
    public Subscription changePlan(UUID id, String planCode, boolean prorate, String effectiveDate, String reason, String actor, String actorName) {
        reason(reason); if (!List.of("immediate","next_period").contains(effectiveDate)) throw bad("Effective date is invalid");
        if (jdbc.queryForList("SELECT code FROM subscription_plans WHERE code=? AND active=true", String.class, planCode).isEmpty()) throw notFound("Plan does not exist");
        Subscription current = one(id);
        if (effectiveDate.equals("immediate")) jdbc.update("UPDATE tenant_subscriptions SET plan_code=?, pending_plan_code=NULL,pending_plan_effective_at=NULL,updated_at=NOW() WHERE id=?", planCode,id);
        else jdbc.update("UPDATE tenant_subscriptions SET pending_plan_code=?, pending_plan_effective_at=current_period_end,updated_at=NOW() WHERE id=?", planCode,id);
        event(id, actor, actorName, "plan_changed", "Subscription plan change recorded", Map.of("planCode",planCode,"effectiveDate",effectiveDate,"prorate",prorate,"reason",reason));
        return one(id);
    }
    @Transactional public Subscription seats(UUID id, int count, String reason, String actor, String name) {
        reason(reason); if (count < 1 || count > 100000) throw bad("Seats must be between 1 and 100000"); one(id);
        jdbc.update("UPDATE tenant_subscriptions SET seats_allocated=?,updated_at=NOW() WHERE id=?",count,id);
        event(id,actor,name,"seats_updated","Subscription seat allocation updated",Map.of("seats",count,"reason",reason)); return one(id);
    }
    @Transactional public Subscription cancel(UUID id, boolean atEnd, String reason, String feedback, String actor, String name) {
        reason(reason); one(id); jdbc.update("UPDATE tenant_subscriptions SET cancel_at_period_end=?,canceled_at=CASE WHEN ? THEN canceled_at ELSE NOW() END,status=CASE WHEN ? THEN status ELSE 'canceled' END,updated_at=NOW() WHERE id=?",atEnd,atEnd,atEnd,id);
        event(id,actor,name,"canceled",atEnd?"Subscription scheduled to cancel at period end":"Subscription canceled immediately",Map.of("cancelAtPeriodEnd",atEnd,"reason",reason,"feedback",feedback==null?"":feedback)); return one(id);
    }
    @Transactional public Subscription reactivate(UUID id, String reason, String actor, String name) {
        reason(reason); one(id); jdbc.update("UPDATE tenant_subscriptions SET status='active',cancel_at_period_end=false,canceled_at=NULL,updated_at=NOW() WHERE id=?",id);
        event(id,actor,name,"reactivated","Subscription reactivated",Map.of("reason",reason)); return one(id);
    }
    @Transactional public Subscription extendTrial(UUID id, int days, String reason, String actor, String name) {
        reason(reason); if (days < 1 || days > 60) throw bad("Trial extension must be between 1 and 60 days"); Subscription sub=one(id);
        if (!sub.status().equals("trialing")) throw bad("Only trialing subscriptions can be extended");
        jdbc.update("UPDATE tenant_subscriptions SET trial_ends_at=COALESCE(trial_ends_at,NOW()) + (? * INTERVAL '1 day'),current_period_end=GREATEST(current_period_end,COALESCE(trial_ends_at,NOW())) + (? * INTERVAL '1 day'),updated_at=NOW() WHERE id=?",days,days,id);
        event(id,actor,name,"trial_extended","Trial period extended",Map.of("days",days,"reason",reason)); return one(id);
    }
    @Transactional public Subscription coupon(UUID id, String code, String actor, String name) {
        if (code == null || !COUPON.matcher(code).matches()) throw bad("Coupon code format is invalid"); one(id);
        jdbc.update("UPDATE tenant_subscriptions SET coupon_code=?,updated_at=NOW() WHERE id=?",code,id);
        event(id,actor,name,"coupon_applied","Coupon code recorded for billing review",Map.of("couponCode",code)); return one(id);
    }

    private Subscription one(UUID id) {
        List<Subscription> found = jdbc.query(baseSelect()+" WHERE s.id=?", this::mapSubscription,id);
        if (found.isEmpty()) throw notFound("Subscription was not found"); return found.get(0);
    }
    private String baseSelect() { return """
        SELECT s.*,t.name tenant_name,t.subdomain,p.code,p.name plan_name,p.tier,p.currency,p.amount_minor,p.billing_interval AS interval,p.seat_limit,p.features,
          (SELECT COUNT(*) FROM firebase_users fu WHERE fu.tenant_id=t.id AND fu.disabled=false) seats_used
        FROM tenant_subscriptions s JOIN tenants t ON t.id=s.tenant_id JOIN subscription_plans p ON p.code=s.plan_code
        """; }
    private Subscription mapSubscription(ResultSet rs,int row) throws SQLException {
        String interval=rs.getString("interval"); long amount=rs.getLong("amount_minor"); long mrr=switch(interval){case "annual"->amount/12;case "quarterly"->amount/3;default->amount;};
        Integer cap=(Integer)rs.getObject("seat_limit"); Integer used=rs.getInt("seats_used");
        Tenant tenant=new Tenant(rs.getObject("tenant_id").toString(),rs.getString("tenant_name"),rs.getString("subdomain"),null);
        PlanRef plan=new PlanRef(rs.getString("code"),rs.getString("code"),rs.getString("plan_name"),rs.getString("tier"),rs.getString("currency"),amount,interval);
        return new Subscription(rs.getObject("id").toString(),tenant,plan,rs.getString("status"),instant(rs.getTimestamp("current_period_start")),instant(rs.getTimestamp("current_period_end")),instantNullable(rs.getTimestamp("trial_ends_at")),rs.getBoolean("cancel_at_period_end"),instantNullable(rs.getTimestamp("canceled_at")),new Seats(rs.getInt("seats_allocated"),used==null?0:used,cap),mrr,rs.getString("currency"),rs.getString("payment_method"),rs.getInt("dunning_attempts"),instantNullable(rs.getTimestamp("last_payment_at")),instantNullable(rs.getTimestamp("current_period_end")),instant(rs.getTimestamp("created_at")),instant(rs.getTimestamp("updated_at")));
    }
    private List<Map<String,Object>> readFeatures(String json) { try { return mapper.readValue(json,new TypeReference<>(){}); } catch(Exception ex) { return List.of(); } }
    private void event(UUID id,String actor,String name,String action,String description,Map<String,?> metadata) {
        try { jdbc.update("INSERT INTO subscription_events(subscription_id,actor_id,actor_name,action,description,metadata) VALUES(?,?,?,?,?,?::jsonb)",id,actor,name==null?"":name,action,description,mapper.writeValueAsString(metadata)); }
        catch(JsonProcessingException e){throw new IllegalStateException("Could not record subscription audit event",e);}
    }
    private static boolean validFilter(String value,List<String> allowed){return value!=null&&!value.isBlank()&&!value.equalsIgnoreCase("all")&&allowed.contains(value.toLowerCase(Locale.ROOT));}
    private static String reason(String r){if(r==null||r.trim().length()<3||r.length()>500)throw bad("A reason between 3 and 500 characters is required");return r.trim();}
    private static String instant(Timestamp t){return t.toInstant().toString();} private static String instantNullable(Timestamp t){return t==null?null:t.toInstant().toString();}
    private static ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);} private static ResponseStatusException notFound(String m){return new ResponseStatusException(HttpStatus.NOT_FOUND,m);}

    public record Page<T>(List<T> data,long total,int page,int pageSize,int totalPages){}
    public record Plan(String id,String code,String name,String tier,String description,String currency,long amountMinor,String interval,int trialDays,Integer seatLimit,List<Map<String,Object>> features,boolean isActive,String createdAt,String updatedAt){}
    public record Stats(long totalSubscriptions,long active,long trialing,long pastDue,long canceled,long mrrMinor,long arrMinor,double churnRatePercent,String currency){}
    public record Tenant(String id,String name,String slug,String region){}
    public record PlanRef(String id,String code,String name,String tier,String currency,long amountMinor,String interval){}
    public record Seats(int seatsAllocated,int seatsUsed,Integer seatLimit){}
    public record Subscription(String id,Tenant tenant,PlanRef plan,String status,String currentPeriodStart,String currentPeriodEnd,String trialEndsAt,boolean cancelAtPeriodEnd,String canceledAt,Seats seats,long mrrMinor,String currency,String paymentMethod,int dunningAttempts,String lastPaymentAt,String nextInvoiceAt,String createdAt,String updatedAt){}
    public record Event(String id,String subscriptionId,String actorId,String actorName,String action,String description,Map<String,Object> metadata,Instant occurredAt){}
}
