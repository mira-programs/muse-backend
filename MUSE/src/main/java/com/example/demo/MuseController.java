package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "api/v1/muse")
public class MuseController {
    private final MuseService museservice;

    @Autowired
    public MuseController(MuseService museservice) {
        this.museservice = museservice;
    }

    @GetMapping
    public List<User> getUsers() {
        return museservice.getUsers();
    }

    @PostMapping
    public void registerNewUser(@RequestBody User user) {
        museservice.addNewUser(user);
    }
}
