package com.example.ia.service;

import com.example.ia.entity.User;
import com.example.ia.payload.request.LoginRequest;
import com.example.ia.payload.request.SignupRequest;
import com.example.ia.payload.response.JwtResponse;
import com.example.ia.repository.UserRepository;
import com.example.ia.security.JwtUtils;
import com.example.ia.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        System.out.println("DEBUG: AuthService authenticating: " + loginRequest.getUsername() + " with password: "
                + loginRequest.getPassword());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal(); // Assuming single role
        String role = userDetails.getAuthorities().stream().findFirst().get().getAuthority();
        // Strip ROLE_ prefix for frontend (frontend expects STUDENT, not ROLE_STUDENT)
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }
        System.out.println("DEBUG: Authentication successful for " + loginRequest.getUsername() + ", Role: " + role);

        return new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                role,
                userDetails.getFullName(),
                userDetails.getDepartment());
    }

    public void registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setRole(signUpRequest.getRole());
        user.setFullName(signUpRequest.getFullName());
        user.setDesignation(signUpRequest.getDesignation());
        user.setDepartment(signUpRequest.getDepartment());
        // Handle other fields as needed

        userRepository.save(user);
    }
}
