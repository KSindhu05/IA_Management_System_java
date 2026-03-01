package com.example.ia.controller;

import com.example.ia.entity.User;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // GET /api/profile — returns full user details
    @GetMapping
    public ResponseEntity<?> getProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("designation", user.getDesignation());
        profile.put("department", user.getDepartment());
        profile.put("role", user.getRole());
        profile.put("semester", user.getSemester());
        profile.put("section", user.getSection());
        return ResponseEntity.ok(profile);
    }

    // PUT /api/profile/credentials — change username and/or password
    @PutMapping("/credentials")
    public ResponseEntity<?> updateCredentials(@RequestBody Map<String, String> body) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        String currentPassword = body.get("currentPassword");
        String newUsername = body.get("newUsername");
        String newPassword = body.get("newPassword");

        // Validate current password
        if (currentPassword == null || currentPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is required"));
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
        }

        boolean changed = false;

        // Username change: only HOD and PRINCIPAL allowed
        if (newUsername != null && !newUsername.trim().isEmpty() && !newUsername.equals(user.getUsername())) {
            if ("FACULTY".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Faculty cannot change username"));
            }
            // Check if the new username is already taken
            if (userRepository.existsByUsernameIgnoreCase(newUsername.trim())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
            }
            user.setUsername(newUsername.trim());
            changed = true;
        }

        // Password change: all roles allowed
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            if (newPassword.length() < 4) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 4 characters"));
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            changed = true;
        }

        if (!changed) {
            return ResponseEntity.badRequest().body(Map.of("message", "No changes provided"));
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Credentials updated successfully"));
    }
}
