package com.example.demo;

import com.example.demo.registration.RegistrationRequest;
import com.example.demo.registration.token.VerificationToken;

import java.util.List;
import java.util.Optional;

public interface IMuserService {
    List<User> getUsers();
    User registerUser(RegistrationRequest request);
    Optional<User> findByEmail(String email);
    String validateToken(String theToken);
    void saveUserVerificationToken(User theUser, String verificationToken);
    VerificationToken generateNewVerificationToken(String oldToken);
}
