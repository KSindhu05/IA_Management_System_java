package com.example.ia.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cie_marks")
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public String getCieType() {
        return cieType;
    }

    public void setCieType(String cieType) {
        this.cieType = cieType;
    }

    public Double getMarks() {
        return marks;
    }

    public void setMarks(Double marks) {
        this.marks = marks;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // Alias for frontend compatibility: frontend reads "totalScore" not "marks"
    public Double getTotalScore() {
        return marks;
    }

    // Flat field accessors for frontend compatibility (frontend reads m.studentId,
    // m.subjectId)
    public Long getStudentId() {
        return student != null ? student.getId() : null;
    }

    public Long getSubjectId() {
        return subject != null ? subject.getId() : null;
    }
}
