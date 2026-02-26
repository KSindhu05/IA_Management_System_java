package com.example.ia.controller;

import com.example.ia.entity.Subject;
import com.example.ia.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    @Autowired
    SubjectRepository subjectRepository;

    @GetMapping("/department/{department}")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL') or hasRole('FACULTY')")
    public List<Subject> getSubjectsByDepartment(@PathVariable String department) {
        return subjectRepository.findByDepartment(department);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> createSubject(@RequestBody Map<String, Object> data) {
        String name = data.getOrDefault("name", "").toString().trim();
        String code = data.getOrDefault("code", "").toString().trim();
        String department = data.getOrDefault("department", "").toString().trim();

        if (name.isEmpty() || code.isEmpty() || department.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Subject name, code, and department are required."));
        }

        // Check for duplicate code in the same department
        if (subjectRepository.findByCodeAndDepartment(code, department).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "A subject with code '" + code + "' already exists in the " + department + " department."));
        }

        Subject subject = new Subject();
        subject.setName(name);
        subject.setCode(code);
        subject.setDepartment(department);
        if (data.containsKey("semester") && data.get("semester") != null) {
            subject.setSemester(Integer.parseInt(data.get("semester").toString()));
        }
        if (data.containsKey("credits") && data.get("credits") != null) {
            subject.setCredits(Integer.parseInt(data.get("credits").toString()));
        }
        if (data.containsKey("instructorName") && data.get("instructorName") != null) {
            subject.setInstructorName(data.get("instructorName").toString().trim());
        }

        subjectRepository.save(subject);
        return ResponseEntity.ok(subject);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        if (subjectRepository.existsById(id)) {
            subjectRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Subject deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> updateSubject(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        return subjectRepository.findById(id).map(subject -> {
            String name = data.getOrDefault("name", "").toString().trim();
            String code = data.getOrDefault("code", "").toString().trim();

            if (name.isEmpty() || code.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Subject name and code are required."));
            }

            // Check if code is being changed and if new code already exists in the same
            // department
            if (!subject.getCode().equals(code)
                    && subjectRepository.findByCodeAndDepartment(code, subject.getDepartment()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "A subject with code '" + code + "' already exists in the "
                                + subject.getDepartment() + " department."));
            }

            subject.setName(name);
            subject.setCode(code);

            if (data.containsKey("semester") && data.get("semester") != null) {
                subject.setSemester(Integer.parseInt(data.get("semester").toString()));
            }
            if (data.containsKey("instructorName") && data.get("instructorName") != null) {
                subject.setInstructorName(data.get("instructorName").toString().trim());
            }

            subjectRepository.save(subject);
            return ResponseEntity.ok(subject);
        }).orElse(ResponseEntity.notFound().build());
    }
}
