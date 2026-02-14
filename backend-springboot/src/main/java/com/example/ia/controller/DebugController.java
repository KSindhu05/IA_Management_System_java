package com.example.ia.controller;

import com.example.ia.entity.User;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    UserRepository userRepository;

    @GetMapping("/user/{username}")
    public String getUserByUsername(@PathVariable String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        return user != null ? user.getPassword() : "User not found";
    }
}
