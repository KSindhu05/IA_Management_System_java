package com.example.ia.controller;

import com.example.ia.entity.Notification;
import com.example.ia.entity.User;
import com.example.ia.repository.NotificationRepository;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping("")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY') or hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<Notification> getMyNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null)
            return List.of();

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @PostMapping("/broadcast")
    // @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')") // Bypass for now
    public ResponseEntity<?> broadcastNotification(@RequestBody Map<String, String> data) {
        // String username =
        // SecurityContextHolder.getContext().getAuthentication().getName();
        String username = data.get("senderId"); // Get from body because Auth might be bypassed

        System.out.println("DEBUG: Broadcast request from user (via body): " + username);

        if (username == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sender ID missing"));
        }

        User sender = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (sender == null) {
            System.out.println("DEBUG: Sender not found in DB for username: " + username);
            return ResponseEntity.badRequest().body(Map.of("message", "Sender not found"));
        }

        String message = data.getOrDefault("message", "");
        String targetRole = data.getOrDefault("targetRole", "FACULTY"); // Default to FACULTY if not provided
        String department = sender.getDepartment();

        System.out.println("DEBUG: Broadcasting message to role: " + targetRole + " in department: " + department);

        // Find all users of targetRole in the same department
        List<User> targets = userRepository.findByRoleAndDepartment(targetRole, department);
        System.out.println("DEBUG: Found " + targets.size() + " targets for broadcast.");

        for (User target : targets) {
            Notification notif = new Notification();
            notif.setUser(target);
            notif.setMessage(message);
            notif.setType("INFO");
            notif.setCategory("broadcast");
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(Map.of("message", "Notification broadcast to " + targets.size() + " recipients"));
    }

    @DeleteMapping("/clear")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY') or hasRole('HOD') or hasRole('PRINCIPAL')")
    public ResponseEntity<?> clearNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        notificationRepository.deleteByUserId(user.getId());

        return ResponseEntity.ok(Map.of("message", "Notifications cleared successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY') or hasRole('HOD') or hasRole('PRINCIPAL')")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null) {
            return ResponseEntity.notFound().build();
        }

        // Security check: Ensure user owns the notification
        if (!notification.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You can only delete your own notifications"));
        }

        notificationRepository.delete(notification);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}
