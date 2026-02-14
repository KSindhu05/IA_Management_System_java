package com.example.ia.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "announcements")
@Data
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "subjectId")
    private Subject subject;

    private String cieNumber;
    private LocalDate scheduledDate;
    private String startTime; // e.g. "10:00 AM"
    private Integer durationMinutes;
    private String examRoom;
    private String status; // SCHEDULED, COMPLETED

    @ManyToOne
    @JoinColumn(name = "facultyId")
    private User faculty;
}
