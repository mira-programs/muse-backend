package com.example.demo;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(path = "/users")
public class MuseController {
    private final MuseService museService;

    @GetMapping("/users")
    public List<User> getUsers() {
        return museService.getUsers();
    }

    @DeleteMapping(path = "userId")
    public void deleteUser(@PathVariable("userId") Long userId) {
        museService.deleteUser(userId);
    }

}
