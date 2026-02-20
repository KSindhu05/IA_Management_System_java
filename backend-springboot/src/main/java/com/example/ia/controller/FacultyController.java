package com.example.ia.controller;

import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.payload.response.FacultyClassAnalytics;
import com.example.ia.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    @Autowired
    FacultyService facultyService;

    @GetMapping("/my-subjects")
    @PreAuthorize("hasRole('FACULTY')")
    public List<Subject> getMySubjects() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return facultyService.getSubjectsForFaculty(username);
    }

    /**
     * Returns students filtered by the logged-in faculty's assigned sections.
     * Faculty's section field stores comma-separated sections, e.g. "A,B".
     * If no section is set, all students are returned (graceful fallback).
     */
    @GetMapping("/my-students")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<Student>> getMyStudents() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Student> students = facultyService.getStudentsForFaculty(username);
        return ResponseEntity.ok(students);
    }

    @GetMapping("/analytics")
    public FacultyClassAnalytics getAnalytics() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return facultyService.getAnalytics(username);
    }
}
