package health.caresync.common.dto;

public record PackageBalanceResponse(
        String packagePurchaseId, int totalSessions, int usedSessions, String status
) {}