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
public class MuseService implements IMuserService {

    private final MuseRepository museRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository tokenRepository;

    @Override
    public List<User> getUsers () {
        return museRepository.findAll();
    }

    @Override
    public User registerUser(RegistrationRequest request) {
        Optional<User> user = this.findByEmail(request.email());
        if (user.isPresent()) {
            throw new IllegalStateException("User with email " + request.email() + " already exists!");
        }
        var newUser = new User();
        newUser.setFirstName(request.firstName());
        newUser.setLastName(request.lastName());
        newUser.setEmail(request.email());
        newUser.setPassword(passwordEncoder.encode(request.password()));
        newUser.setRole("ADMIN"); // creator

        return museRepository.save(newUser);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return museRepository.findUserByEmail(email); // query to the database to search for user with attribute = email
    }

    @Override
    public void saveUserVerificationToken(User theUser, String token) {
        var verificationToken = new VerificationToken(token, theUser);
        tokenRepository.save(verificationToken);
    }

    @Override
    public String validateToken(String theToken) {
        VerificationToken token = tokenRepository.findByToken(theToken);
        if (token == null) {
            return "Invalid verification token.";
        }
        User user = token.getUser();
        Calendar calendar = Calendar.getInstance();
        if ((token.getExpirationTime().getTime() - calendar.getTime().getTime()) <=0 ) {
            tokenRepository.delete(token);
            return "Token has already expired.";
        }
        user.setEnabled(true);
        museRepository.save(user);
        return "Valid.";
    }

    public void deleteUser(Long userId) {
        museRepository.findById(userId);
        boolean exists = museRepository.existsById(userId);
        if (!exists) {
            throw new IllegalStateException("student with id " + userId + " does not exist");
        }
        museRepository.deleteById(userId);
    }

    @Override
    public VerificationToken generateNewVerificationToken(String oldToken) {
        VerificationToken verificationToken = tokenRepository.findByToken(oldToken);
        var tokenExpirationTime = new VerificationToken();
        verificationToken.setToken(UUID.randomUUID().toString());
        verificationToken.setExpirationTime(tokenExpirationTime.getTokenExpirationTime());
        return tokenRepository.save(verificationToken);
    }
}
