package com.example.ia.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "announcements")
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    private String cieNumber;
    private LocalDate scheduledDate;
    private String startTime; // e.g. "10:00 AM"
    private Integer durationMinutes;
    private String examRoom;
    private String status; // SCHEDULED, COMPLETED

    @Column(length = 2000)
    private String syllabusCoverage; // Topics entered by faculty

    @ManyToOne
    @JoinColumn(name = "faculty_id")
    private User faculty;

    public Announcement() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public String getCieNumber() {
        return cieNumber;
    }

    public void setCieNumber(String cieNumber) {
        this.cieNumber = cieNumber;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getExamRoom() {
        return examRoom;
    }

    public void setExamRoom(String examRoom) {
        this.examRoom = examRoom;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public User getFaculty() {
        return faculty;
    }

    public void setFaculty(User faculty) {
        this.faculty = faculty;
    }

    public String getSyllabusCoverage() {
        return syllabusCoverage;
    }

    public void setSyllabusCoverage(String syllabusCoverage) {
        this.syllabusCoverage = syllabusCoverage;
    }
}
