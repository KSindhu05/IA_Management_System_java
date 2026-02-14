package com.example.ia.payload.request;

import lombok.Data;

@Data
public class SignupRequest {
    private String username;
    private String email;
    private String password;
    private String role;
    private String fullName;
    private String designation;
    private String department;
}
