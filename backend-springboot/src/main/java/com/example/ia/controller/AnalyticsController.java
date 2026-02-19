package com.example.ia.controller;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.StudentRepository;
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
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    CieMarkRepository cieMarkRepository;

    @GetMapping("/department/{deptId}/stats")
    @PreAuthorize("hasRole('PRINCIPAL') or hasRole('HOD')")
    public ResponseEntity<?> getDepartmentStats(@PathVariable String deptId) {
        Map<String, Object> response = new HashMap<>();

        // 1. Student Count
        List<Student> students = studentRepository.findByDepartment(deptId);
        response.put("studentCount", students.size());

        // 2. Faculty Count
        long facultyCount = userRepository.countByRoleAndDepartment("FACULTY", deptId);
        response.put("facultyCount", facultyCount);

        // 3. Pass Percentage & At Risk (Calculated from CIE Marks)
        // This is a simplified calculation: Avg score > 40% (20/50 or similar
        // threshold)
        // Logic: Get all marks for students in this dept.
        // Better: For each student, check if they are failing any subject.

        int atRiskCount = 0;
        int totalPassed = 0;
        int totalEvaluatedStudents = 0;

        for (Student s : students) {
            List<CieMark> marks = cieMarkRepository.findByStudent_Id(s.getId());
            if (marks.isEmpty())
                continue;

            totalEvaluatedStudents++;
            boolean isFailingAny = marks.stream().anyMatch(m -> m.getMarks() != null && m.getMarks() < 20); // Assuming
                                                                                                            // < 20 is
                                                                                                            // fail for
                                                                                                            // CIE (out
                                                                                                            // of 50)

            if (isFailingAny) {
                atRiskCount++;
            } else {
                totalPassed++;
            }
        }

        double passPercentage = totalEvaluatedStudents > 0
                ? (double) totalPassed / totalEvaluatedStudents * 100
                : 0;

        response.put("passPercentage", Math.round(passPercentage));
        response.put("atRiskCount", atRiskCount);

        return ResponseEntity.ok(response);
    }
}
