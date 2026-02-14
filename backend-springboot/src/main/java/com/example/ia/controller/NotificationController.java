package com.example.ia.controller;

import com.example.ia.entity.Notification;
import com.example.ia.entity.User;
import com.example.ia.repository.NotificationRepository;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping("/")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY') or hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<Notification> getMyNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null)
            return List.of();

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
}
