package com.example.demo;
// Service layer, interacts with the data access layer (repositories, databases) and may be used by controllers.

import com.example.demo.registration.RegistrationRequest;
import com.example.demo.registration.token.VerificationToken;
import com.example.demo.registration.token.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MuseService {

    private final MuseRepository museRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository tokenRepository;

    public List<User> getUsers () {
        return museRepository.findAll();
    }

    public User registerUser(RegistrationRequest request) {
        Optional<User> user = this.findByEmail(request.email());
        if (user.isPresent()) {
            throw new IllegalStateException("User with email " + request.email() + " already exists!");
        }
        var newUser = new User();
        newUser.setFirstName(request.firstName());
        newUser.setFirstName(request.lastName());
        newUser.setEmail(request.email());
        newUser.setPassword(passwordEncoder.encode(request.password()));
        newUser.setRole(request.role());

        return museRepository.save(newUser);
    }

    public void addNewUser(User user) {
        Optional<User> userOptional = findByEmail(user.getEmail());
        if (userOptional.isPresent()) {
            throw new IllegalStateException("email taken!");
        }
        museRepository.save(user);
    }

    public void deleteUser(Long userId) {
        museRepository.findById(userId);
        boolean exists = museRepository.existsById(userId);
        if (!exists) {
            throw new IllegalStateException("student with id " + userId + " does not exist");
        }
        museRepository.deleteById(userId);
    }

    public Optional<User> findByEmail(String email) {
        return museRepository.findUserByEmail(email);
    }

    public void saveUserVerificationToken(User theUser, String token) {
        var verificationToken = new VerificationToken(token, theUser);
        tokenRepository.save(verificationToken);
    }

    public String validateToken(String theToken) {
        VerificationToken token = tokenRepository.findByToken(theToken);
        if (token == null) {
            return "Invalid verification token.";
        }
        User user = token.getUser();
        Calendar calendar = Calendar.getInstance();
        if (token.getExpirationTime().getTime() - calendar.getTime().getTime() <=0) {
            tokenRepository.delete(token);
            return "Token has already expired.";
        }

        user.setEnabled(true);
        museRepository.save(user);
        return "Valid.";
    }
}
