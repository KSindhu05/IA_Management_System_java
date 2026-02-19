package com.example.ia.controller;

import com.example.ia.payload.request.LoginRequest;
import com.example.ia.payload.request.SignupRequest;
import com.example.ia.payload.response.JwtResponse;
import com.example.ia.payload.response.MessageResponse;
import com.example.ia.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        System.out.println("DEBUG: AuthController received login request for: " + loginRequest.getUsername());
        try {
            return ResponseEntity.ok(authService.authenticateUser(loginRequest));
        } catch (Exception e) {
            System.out
                    .println("DEBUG: Authentication failed for " + loginRequest.getUsername() + ": " + e.getMessage());
            return ResponseEntity.status(401).body(new MessageResponse("Invalid credentials"));
        }
    }

    @PostMapping("/signup") // Assuming an admin or initial script calls this
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
