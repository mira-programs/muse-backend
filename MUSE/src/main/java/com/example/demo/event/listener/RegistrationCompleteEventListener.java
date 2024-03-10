package com.example.demo.event.listener;


import com.example.demo.MuseService;
import com.example.demo.User;
import com.example.demo.event.RegistrationCompleteEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegistrationCompleteEventListener implements ApplicationListener<RegistrationCompleteEvent> {

    private final MuseService museService;
    private final JavaMailSender mailSender;
    private User theUser;

    @Override
    public void onApplicationEvent(RegistrationCompleteEvent event) {
        // 1. Get the newly registered user

        theUser = event.getUser();

        // 2. Create a verification token for that user
        String verificationToken = UUID.randomUUID().toString();

        // 3. Save the verification token for the user
        museService.saveUserVerificationToken(theUser, verificationToken);

        // 4. Build the verification url to be sent to the user
        String url = event.getApplicationUrl() + "/register/verifyEmail?token=" + verificationToken;

        // 5. Send the email
        try {
            sendVerificationEmail(url);
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
        log.info("Click on the link to verify your email: {}", url);

    }


    public void sendVerificationEmail(String url) throws MessagingException, UnsupportedEncodingException {
        String subject = "MUSE - Email Verification";
        String senderName = "MUSE";
        String mailContent = "<p>Hi, "+ theUser.getFirstName()+", </p>"+"<p>Thank you for registering with MUSE! Please follow the link below to complete your registration.</p>>"
                +"<a href=\""+url+"\">Verify your email to activate your account</a>"+
                "<p>Thank you <br> MUSE team";
        MimeMessage message = mailSender.createMimeMessage();
        var messageHelper = new MimeMessageHelper(message);
        messageHelper.setFrom("dalaibrahim10@gmail.com", senderName);
        messageHelper.setTo(theUser.getEmail());
        messageHelper.setSubject(subject);
        messageHelper.setText(mailContent, true);
        mailSender.send(message);
    }


}
