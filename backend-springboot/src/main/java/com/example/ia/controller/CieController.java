package com.example.ia.controller;

import com.example.ia.entity.Notification;
import com.example.ia.repository.NotificationRepository;
import com.example.ia.security.JwtUtils;
import com.example.ia.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/cie")
public class CieController {

    @Autowired
    com.example.ia.service.CieService cieService;

    @GetMapping("/student/announcements")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public List<com.example.ia.entity.Announcement> getStudentAnnouncements() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return cieService.getStudentAnnouncements(username);
    }

    @GetMapping("/student/notifications")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public List<com.example.ia.entity.Notification> getStudentNotifications() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return cieService.getStudentNotifications(username);
    }

    @GetMapping("/faculty/schedules")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FACULTY')")
    public List<com.example.ia.entity.Announcement> getFacultySchedules() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return cieService.getFacultySchedules(username);
    }
}
