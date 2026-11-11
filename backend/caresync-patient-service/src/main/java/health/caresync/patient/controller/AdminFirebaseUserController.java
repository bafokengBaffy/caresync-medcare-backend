package health.caresync.patient.controller;

import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.admin.FirebaseAccountLookupResponse;
import health.caresync.patient.dto.admin.SendVerificationEmailResponse;
import health.caresync.patient.service.FirebaseVerificationService;
import health.caresync.patient.service.AdminUserService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/admin/firebase/users")
@Validated
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminFirebaseUserController {
    private final AdminUserService users;
    private final FirebaseVerificationService verificationService;

    public AdminFirebaseUserController(AdminUserService users, FirebaseVerificationService verificationService) {
        this.users = users;
        this.verificationService = verificationService;
    }

    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<FirebaseAccountLookupResponse>> lookup(
        @RequestParam @NotBlank @Email String email
    ) {
        return ResponseEntity.ok(ApiResponse.ok(users.lookupFirebaseAccount(email)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{firebaseUid}/send-verification")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SendVerificationEmailResponse>> sendVerification(
        @org.springframework.web.bind.annotation.PathVariable String firebaseUid
    ) {
        verificationService.sendVerificationEmail(firebaseUid);
        return ResponseEntity.ok(ApiResponse.ok(new SendVerificationEmailResponse("Verification email sent")));
    }
}
