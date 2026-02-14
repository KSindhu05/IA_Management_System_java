package com.example.ia.controller;

import com.example.ia.entity.Student;
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
    public List<Student> getAllStudents(@RequestParam(required = false) String department) {
        return studentService.getAllStudents(department);
    }

    @GetMapping("/faculty")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public List<com.example.ia.payload.response.FacultyResponse> getFaculty() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return studentService.getFacultyForStudent(username);
    }
}
