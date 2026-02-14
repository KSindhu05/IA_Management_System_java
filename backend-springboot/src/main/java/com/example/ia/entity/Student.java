package com.example.ia.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "students")
@Data
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String regNo;

    @Column(nullable = false)
    private String name;

    private String department;
    private Integer semester;
    private String section;
    private String email;
    private String phone;
    private String parentPhone;
}
