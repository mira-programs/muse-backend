package com.example.demo;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/users")
@RequiredArgsConstructor
public class MuseController {
    private final MuseService museService;

    @GetMapping
    public List<User> getUsers() {
        return museService.getUsers();
    }

    @PostMapping
    public void registerNewUser(@RequestBody User user) {
        museService.addNewUser(user);
    }

    @DeleteMapping(path = "userId")
    public void deleteUser(@PathVariable("userId") Long userId) {
        museService.deleteUser(userId);
    }
}
