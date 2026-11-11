package health.caresync.patient.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class EmailDeliveryService {
    private final ObjectProvider<JavaMailSender> mailSenders;
    private final String fromAddress;

    public EmailDeliveryService(
        ObjectProvider<JavaMailSender> mailSenders,
        @Value("${caresync.email.from:no-reply@caresync.example}") String fromAddress
    ) {
        this.mailSenders = mailSenders;
        this.fromAddress = fromAddress;
    }

    public void sendVerificationEmail(String recipient, String verificationLink) {
        JavaMailSender mailSender = mailSenders.getIfAvailable();
        if (mailSender == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMTP email delivery is not configured");
        }
        if (mailSender instanceof JavaMailSenderImpl sender
            && (sender.getHost() == null || sender.getHost().isBlank())) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMTP email delivery is not configured");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipient);
            helper.setSubject("Verify your CareSync email address");
            helper.setText(
                "Use the following link to verify your CareSync email address:\n\n" + verificationLink,
                false
            );
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new IllegalStateException("Could not send Firebase verification email", exception);
        }
    }
}
