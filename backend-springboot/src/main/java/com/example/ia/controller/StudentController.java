package com.example.ia.controller;

import com.example.ia.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/student") // Match existing node route
public class StudentController {
    @Autowired
    StudentService studentService;

    @GetMapping("/all")
    public List<com.example.ia.payload.response.StudentResponse> getAllStudents(
            @RequestParam(required = false) String department) {
        return studentService.getStudentsWithAnalytics(department);
    }

    @GetMapping("/faculty")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public List<com.example.ia.payload.response.FacultyResponse> getFaculty() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return studentService.getFacultyForStudent(username);
    }

    @GetMapping("/profile")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public org.springframework.http.ResponseEntity<?> getProfile() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return studentService.getStudentByRegNo(username)
                .map(student -> org.springframework.http.ResponseEntity.ok((Object) student))
                .orElse(org.springframework.http.ResponseEntity.notFound().build());
    }
}
