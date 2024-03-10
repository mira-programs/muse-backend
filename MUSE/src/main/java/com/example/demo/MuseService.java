package com.example.demo;
// Service layer, interacts with the data access layer (repositories, databases) and may be used by controllers.

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MuseService {

    private final MuseRepository museRepository;

    @Autowired
    public MuseService(MuseRepository museRepository) {
        this.museRepository = museRepository;
    }

    public List<User> getUsers () {
        return museRepository.findAll();
    }

    public void addNewUser(User user) {
        Optional<User> userOptional = museRepository.findUserByEmail(user.getEmail());
        if (userOptional.isPresent()) {
            throw new IllegalStateException("email taken!");
        }
        museRepository.save(user);
    }

}
