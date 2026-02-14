package com.example.ia.controller;

import com.example.ia.entity.User;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/hod")
public class HodController {
    @Autowired
    UserRepository userRepository;

    @GetMapping("/overview")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> getOverview(@RequestParam String department) {
        // Return mock data similar to Node.js for now or implement real logic
        Map<String, Object> data = new HashMap<>();
        data.put("stats", Map.of("totalStudents", 63, "facultyCount", 5));
        return ResponseEntity.ok(data);
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('HOD')")
    public List<User> getFaculty(@RequestParam String department) {
        return userRepository.findByDepartment(department);
    }
}
