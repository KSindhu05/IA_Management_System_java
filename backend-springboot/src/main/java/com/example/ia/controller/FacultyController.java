package com.example.ia.controller;

import com.example.ia.entity.Subject;
import com.example.ia.payload.response.FacultyClassAnalytics;
import com.example.ia.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @GetMapping("/analytics")
    public FacultyClassAnalytics getAnalytics() {
        // Allow PRINCIPAL/HOD too if needed, or strictly FACULTY
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return facultyService.getAnalytics(username);
    }
}
