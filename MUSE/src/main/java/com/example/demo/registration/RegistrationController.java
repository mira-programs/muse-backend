package com.example.demo.registration;

import com.example.demo.MuseService;
import com.example.demo.User;
import com.example.demo.event.RegistrationCompleteEvent;
import com.example.demo.registration.token.VerificationTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.bind.annotation.*;
import com.example.demo.registration.token.VerificationToken;

@RestController
@RequestMapping(path = "/register")
@RequiredArgsConstructor
public class RegistrationController {

    private final MuseService museService;
    private final ApplicationEventPublisher publisher;
    private final VerificationTokenRepository tokenRepository;


    @PostMapping
    public String registerUser(@RequestBody RegistrationRequest registrationRequest, final HttpServletRequest request) {
        User user = museService.registerUser(registrationRequest);
        publisher.publishEvent(new RegistrationCompleteEvent(user,applicationUrl(request)));
        return "Success! Please check your email to complete the verification process.";
    }

    @GetMapping("/verifyEmail")
    public String verifyEmail(@RequestParam("token") String token) {
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

    public String applicationUrl(HttpServletRequest request) {
        return "https://" + request.getServerName()+":"+request.getServerPort()+request.getContextPath();
    }

}
