package com.example.ia.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "cie_marks")
@Data
public class CieMark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "studentId", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "subjectId", nullable = false)
    private Subject subject;

    // CIE1, CIE2, CIE3, CIE4, CIE5
    @Column(nullable = false)
    private String cieType;

    // Total marks (out of 50)
    private Double marks;

    // PENDING, SUBMITTED, APPROVED, REJECTED
    @Column(nullable = false)
    private String status = "PENDING";
}
