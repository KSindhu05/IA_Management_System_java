package com.example.ia.controller;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    CieMarkRepository cieMarkRepository;

    @GetMapping("/department/{department}/stats")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public Map<String, Object> getDepartmentStats(@PathVariable String department) {
        List<Student> students = studentRepository.findByDepartment(department);
        List<Subject> subjects = subjectRepository.findByDepartment(department);

        double totalScore = 0;
        int totalCount = 0;
        int passCount = 0;
        int failCount = 0;

        // Track per-student totals for at-risk calculation
        Map<Long, List<Double>> studentMarksMap = new HashMap<>();

        for (Subject sub : subjects) {
            List<CieMark> marks = cieMarkRepository.findBySubject_Id(sub.getId());
            for (CieMark mark : marks) {
                // Skip PENDING marks with 0 score (not yet entered)
                if (mark.getMarks() != null && !(mark.getMarks() == 0 && "PENDING".equals(mark.getStatus()))) {
                    totalScore += mark.getMarks();
                    totalCount++;
                    if (mark.getMarks() >= 20) { // Pass threshold 20/50
                        passCount++;
                    } else {
                        failCount++;
                    }
                    // Track per-student for at-risk
                    if (mark.getStudent() != null) {
                        studentMarksMap
                                .computeIfAbsent(mark.getStudent().getId(), k -> new ArrayList<>())
                                .add(mark.getMarks());
                    }
                }
            }
        }

        double deptAverage = totalCount > 0 ? totalScore / totalCount : 0;
        double passPercentage = totalCount > 0 ? (passCount * 100.0 / totalCount) : 0;

        // Calculate at-risk students (avg marks < 20)
        int atRiskCount = 0;
        for (List<Double> marksList : studentMarksMap.values()) {
            double avg = marksList.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            if (avg < 20) {
                atRiskCount++;
            }
        }

        // Build per-subject stats
        List<Map<String, Object>> subjectStats = new ArrayList<>();
        for (Subject sub : subjects) {
            List<CieMark> marks = cieMarkRepository.findBySubject_Id(sub.getId());
            double subTotal = 0;
            int subCount = 0;
            int subPass = 0;
            for (CieMark mark : marks) {
                if (mark.getMarks() != null && !(mark.getMarks() == 0 && "PENDING".equals(mark.getStatus()))) {
                    subTotal += mark.getMarks();
                    subCount++;
                    if (mark.getMarks() >= 20)
                        subPass++;
                }
            }
            Map<String, Object> stat = new HashMap<>();
            stat.put("subjectName", sub.getName());
            stat.put("subjectId", sub.getId());
            stat.put("average", subCount > 0 ? Math.round((subTotal / subCount) * 100.0) / 100.0 : 0);
            stat.put("passPercentage", subCount > 0 ? Math.round((subPass * 100.0 / subCount) * 100.0) / 100.0 : 0);
            stat.put("totalStudents", subCount);
            subjectStats.add(stat);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalStudents", students.size());
        result.put("totalSubjects", subjects.size());
        result.put("average", Math.round(deptAverage * 100.0) / 100.0); // Frontend reads 'average'
        result.put("passPercentage", Math.round(passPercentage * 100.0) / 100.0);
        result.put("passCount", passCount);
        result.put("failCount", failCount);
        result.put("atRiskCount", atRiskCount); // Frontend reads 'atRiskCount'
        result.put("subjectStats", subjectStats);

        return result;
    }
}
