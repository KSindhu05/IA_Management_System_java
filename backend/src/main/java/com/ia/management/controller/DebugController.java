package com.ia.management.controller;

import com.ia.management.model.Student;
import com.ia.management.model.User;
import com.ia.management.repository.StudentRepository;
import com.ia.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping("/check-student/{regNo}")
    public Map<String, Object> checkStudent(@PathVariable String regNo) {
        Map<String, Object> result = new HashMap<>();

        Optional<User> user = userRepository.findByUsername(regNo);
        Optional<Student> student = studentRepository.findByRegNo(regNo);

        result.put("regNo", regNo);
        
        // Check User
        result.put("userExists", user.isPresent());
        if (user.isPresent()) {
            result.put("userId", user.get().getId());
            result.put("userRole", user.get().getRole());
            result.put("hasPassword", user.get().getPassword() != null && !user.get().getPassword().isEmpty());
        }

        // Check Student
        result.put("studentExists", student.isPresent());
        if (student.isPresent()) {
            result.put("studentId", student.get().getId());
            result.put("studentName", student.get().getName());
            result.put("studentHasUser", student.get().getUser() != null);
            if (student.get().getUser() != null) {
                result.put("studentUserId", student.get().getUser().getId());
            }
        }

        return result;
    }

    @GetMapping("/users/count")
    public Map<String, Object> countUsers() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalUsers", userRepository.count());
        result.put("studentUsers", userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STUDENT)
                .count());
        return result;
    }

    @GetMapping("/students/count")
    public Map<String, Object> countStudents() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalStudents", studentRepository.count());
        result.put("studentsWithUser", studentRepository.findAll().stream()
                .filter(s -> s.getUser() != null)
                .count());
        return result;
    }
}
