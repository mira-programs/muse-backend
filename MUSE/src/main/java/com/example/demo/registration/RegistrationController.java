package com.example.demo.registration;

import com.example.demo.MuseService;
import com.example.demo.User;
import com.example.demo.event.RegistrationCompleteEvent;
import com.example.demo.event.listener.RegistrationCompleteEventListener;
import com.example.demo.registration.token.VerificationTokenRepository;
import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.bind.annotation.*;
import com.example.demo.registration.token.VerificationToken;

import java.io.UnsupportedEncodingException;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/register")
public class RegistrationController {

    private final MuseService museService;
    private final ApplicationEventPublisher publisher;
    private final VerificationTokenRepository tokenRepository;
    private final RegistrationCompleteEventListener eventListener;
    private final HttpServletRequest servletRequest;

    @PostMapping
    public String registerUser(@RequestBody RegistrationRequest registrationRequest, final HttpServletRequest request) {
        User user = museService.registerUser(registrationRequest);
        publisher.publishEvent(new RegistrationCompleteEvent(user,applicationUrl(request)));
        return "Success! Please check your email to complete the verification process.";
    }

    @GetMapping("/verifyEmail")
    public String sendVerificationEmail(@RequestParam("token") String token) {
        VerificationToken theToken = tokenRepository.findByToken(token);
        if (theToken.getUser().isEnabled()) {
            return "This account has already been verified, please login.";
        }

        String verificationResult = museService.validateToken(token);
        if (verificationResult.equalsIgnoreCase("Valid.")) {
            return "Email verified successfully! Please login to your account.";
        }

        return "Invalid verification token.";
    }

    @GetMapping("/resend-verification-token")
    public String resendVerificationToken(@RequestParam("token") String oldToken, HttpServletRequest request)
            throws MessagingException, UnsupportedEncodingException {
        VerificationToken verificationToken =  museService.generateNewVerificationToken(oldToken);
        User theUser = verificationToken.getUser();
        resendVerificationTokenEmail(theUser, applicationUrl(request), verificationToken);
        return "A new verification link has been sent to your email," +
                " click the link to complete your registration.";
    }

    private void resendVerificationTokenEmail(User theUser, String applicationUrl, VerificationToken token)
            throws MessagingException, UnsupportedEncodingException {
        String url = applicationUrl+"/register/verifyEmail?token="+token.getToken();
        eventListener.sendVerificationEmail(url);
        log.info("Click the link to verify your registration :  {}", url);
    }

    public String applicationUrl(HttpServletRequest request) {
        return "http://"+request.getServerName()+":"
                +request.getServerPort()+request.getContextPath();
    }

}
