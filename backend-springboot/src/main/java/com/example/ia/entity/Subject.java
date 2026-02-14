package com.example.ia.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "subjects")
@Data
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    private String department;
    private Integer semester;

    // Optional: link to instructor user if needed, but current logic uses string in
    // User
    private String instructorName;
}
