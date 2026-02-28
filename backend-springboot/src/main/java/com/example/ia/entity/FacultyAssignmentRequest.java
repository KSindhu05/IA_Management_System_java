package com.example.ia.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_assignment_requests")
public class FacultyAssignmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long facultyId;

    private String facultyName;

    @Column(nullable = false)
    private String targetDepartment;

    @Column(columnDefinition = "TEXT")
    private String subjects; // Comma-separated subject names

    private String sections; // Comma-separated sections

    private String semester;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    // CIE role for split subjects: THEORY (CIE-1,2,5), LAB (CIE-3,4), or null (ALL)
    private String cieRole;

    private LocalDateTime requestDate;

    private LocalDateTime responseDate;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

    public String getTargetDepartment() {
        return targetDepartment;
    }

    public void setTargetDepartment(String targetDepartment) {
        this.targetDepartment = targetDepartment;
    }

    public String getSubjects() {
        return subjects;
    }

    public void setSubjects(String subjects) {
        this.subjects = subjects;
    }

    public String getSections() {
        return sections;
    }

    public void setSections(String sections) {
        this.sections = sections;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCieRole() {
        return cieRole;
    }

    public void setCieRole(String cieRole) {
        this.cieRole = cieRole;
    }

    public LocalDateTime getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(LocalDateTime requestDate) {
        this.requestDate = requestDate;
    }

    public LocalDateTime getResponseDate() {
        return responseDate;
    }

    public void setResponseDate(LocalDateTime responseDate) {
        this.responseDate = responseDate;
    }
}
