package com.example.ia.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String fullName;
    private String email;
    private String designation;
    private String department;

    // Role: HOD, FACULTY, PRINCIPAL
    @Column(nullable = false)
    private String role;

    // For faculty: assigned semester/section
    private String semester;
    private String section;

    // Comma-separated list of subjects
    @Column(columnDefinition = "TEXT")
    private String subjects;
}
