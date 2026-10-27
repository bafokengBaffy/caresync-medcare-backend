package health.caresync.patient.dto;

public record FirebaseUserSyncResponse(int syncedUsers, int usersWithoutTenant, int pagesRead) { }
