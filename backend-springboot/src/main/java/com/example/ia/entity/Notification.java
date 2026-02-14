package com.example.ia.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "userId")
    private User user;

    private String message;
    private String type; // INFO, WARNING, ALETR
    private boolean isRead = false;
    private String category;

    private LocalDateTime createdAt = LocalDateTime.now();
}
