package com.example.ia.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "attendance")
@Data
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "studentId")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "subjectId")
    private Subject subject;

    private LocalDate date;

    // PRESENT, ABSENT
    private String status;

    @ManyToOne
    @JoinColumn(name = "facultyId")
    private User faculty;
}
