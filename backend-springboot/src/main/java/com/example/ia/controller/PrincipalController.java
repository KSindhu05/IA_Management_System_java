package com.example.ia.controller;

import com.example.ia.entity.Announcement;
import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;

import com.example.ia.entity.Subject;
import com.example.ia.entity.User;
import com.example.ia.repository.AnnouncementRepository;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import com.example.ia.entity.Notification;
import com.example.ia.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/principal")
public class PrincipalController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    AnnouncementRepository announcementRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    CieMarkRepository cieMarkRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<?> getDashboard() {
        System.out.println("DEBUG: Principal Dashboard Endpoint Hit");
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            System.out.println("DEBUG: Authenticated user: " + username);
            System.out.println("DEBUG: Authorities: " + org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getAuthorities());
        } catch (Exception e) {
            System.out.println("DEBUG: Could not get auth details: " + e.getMessage());
        }

        Map<String, Object> response = new HashMap<>();

        // 1. Stats
        long totalStudents = studentRepository.count();
        long totalFaculty = userRepository.countByRoleAndDepartment("FACULTY", null); // Assuming role, generic count
        if (totalFaculty == 0) {
            // Fallback if countByRoleAndDepartment needs explicit null handling or isn't
            // built for it
            totalFaculty = userRepository.findByRole("FACULTY").size();
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalFaculty", totalFaculty);
        response.put("stats", stats);

        // 2. Branches & Performance
        // Get all subjects
        List<Subject> allSubjects = subjectRepository.findAll();
        // distinct departments
        Set<String> departments = allSubjects.stream()
                .map(Subject::getDepartment)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (departments.isEmpty()) {
            departments.addAll(Arrays.asList("CS", "EC", "ME", "CV"));
        }

        List<String> branchList = new ArrayList<>(departments);
        Collections.sort(branchList);

        List<Double> branchPerformance = new ArrayList<>();
        List<Map<String, Object>> hodSubmissionStatus = new ArrayList<>();

        for (String dept : branchList) {
            // Get marks for this Dept
            List<Subject> deptSubjects = subjectRepository.findByDepartment(dept);
            List<CieMark> deptMarks = new ArrayList<>();
            for (Subject s : deptSubjects) {
                deptMarks.addAll(cieMarkRepository.findBySubject_Id(s.getId()));
            }

            // Calculate Avg
            double avg = deptMarks.stream()
                    .filter(m -> m.getMarks() != null)
                    .mapToDouble(CieMark::getMarks)
                    .average()
                    .orElse(0.0);

            // Normalize to percentage (assuming max 50)
            double percentage = (avg / 50.0) * 100.0;
            branchPerformance.add(Math.round(percentage * 10.0) / 10.0);

            // HOD Status (Mock logic based on performance/completion)
            Map<String, Object> status = new HashMap<>();
            status.put("id", dept);
            status.put("dept", dept);
            List<User> hods = userRepository.findByRoleAndDepartment("HOD", dept);
            String hodName = hods.isEmpty() ? "Not Assigned" : hods.get(0).getFullName();
            status.put("hod", hodName);
            status.put("status", percentage > 50 ? "Approved" : "Pending");
            status.put("punctuality", "On Time");
            hodSubmissionStatus.add(status);
        }

        response.put("branches", branchList);
        response.put("branchPerformance", branchPerformance);
        response.put("hodSubmissionStatus", hodSubmissionStatus);

        // 3. Faculty Analytics (Aggregated)
        List<CieMark> allMarks = cieMarkRepository.findAll();
        double globalAvg = allMarks.stream().filter(m -> m.getMarks() != null).mapToDouble(CieMark::getMarks).average()
                .orElse(0.0);
        double globalPassRate = 0;
        long passed = allMarks.stream().filter(m -> m.getMarks() != null && m.getMarks() >= 20).count();
        if (!allMarks.isEmpty()) {
            globalPassRate = (double) passed / allMarks.size() * 100;
        }

        long pendingMarks = allMarks.stream().filter(m -> "PENDING".equals(m.getStatus())).count();
        long evaluatedMarks = allMarks.size() - pendingMarks;

        Map<String, Object> facultyAnalytics = new HashMap<>();
        facultyAnalytics.put("avgScore", Math.round((globalAvg / 50.0 * 100) * 10.0) / 10.0);
        facultyAnalytics.put("passRate", Math.round(globalPassRate * 10.0) / 10.0);
        facultyAnalytics.put("evaluated", evaluatedMarks);
        facultyAnalytics.put("pending", pendingMarks);
        response.put("facultyAnalytics", facultyAnalytics);

        // 4. Low Performers (Marks < 20)
        List<Map<String, Object>> lowPerformers = allMarks.stream()
                .filter(m -> m.getMarks() != null && m.getMarks() < 20 && m.getStudent() != null)
                .limit(10) // Limit to 10
                .map(m -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("marks", m.getMarks());

                    Map<String, String> student = new HashMap<>();
                    student.put("name", m.getStudent().getName());
                    student.put("regNo", m.getStudent().getRegNo());
                    student.put("department", m.getStudent().getDepartment());
                    item.put("student", student);

                    Map<String, String> subj = new HashMap<>();
                    subj.put("code", m.getSubject().getCode());
                    item.put("subject", subj);

                    return item;
                })
                .collect(Collectors.toList());
        response.put("lowPerformers", lowPerformers);

        // 5. CIE Stats
        // Mocking conducted/graded distinction if not available
        Map<String, Object> cieStats = new HashMap<>();
        cieStats.put("conducted", evaluatedMarks + pendingMarks);
        cieStats.put("pending", pendingMarks);
        cieStats.put("graded", evaluatedMarks);
        response.put("cieStats", cieStats);

        // 6. Common Mock/Placeholder Data for UI completeness
        response.put("dates", new ArrayList<>()); // Schedule
        response.put("approvals", new ArrayList<>()); // Pending Approvals

        Map<String, Object> trends = new HashMap<>();
        trends.put("labels", Arrays.asList("2021", "2022", "2023", "2024", "2025"));
        trends.put("datasets", Collections.singletonList(
                Map.of("data", Arrays.asList(65, 59, 80, 81, 85), "borderColor", "#4f46e5", "tension", 0.4)));
        response.put("trends", trends);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/faculty/all")
    public List<User> getAllFaculty() {
        return userRepository.findByRole("FACULTY");
    }

    @GetMapping("/timetables")
    public List<Announcement> getTimetables() {
        return announcementRepository.findAll();
    }

    @GetMapping("/debug/seed-cie")
    public String seedCie() {
        try {
            Subject s = subjectRepository.findAll().stream()
                    .filter(sub -> "CSE".equals(sub.getDepartment()))
                    .findFirst()
                    .orElse(null);

            if (s == null)
                return "Error: No CSE subjects found to attach CIE to.";

            Announcement a = new Announcement();
            a.setSubject(s);
            a.setCieNumber("TEST-" + System.currentTimeMillis() % 1000);
            a.setScheduledDate(java.time.LocalDate.now().plusDays(2));
            a.setStartTime("02:00 PM");
            a.setDurationMinutes(90);
            a.setStatus("SCHEDULED");
            a.setExamRoom("Room 101");

            User u = userRepository.findByRole("FACULTY").stream().findFirst().orElse(null);
            if (u == null)
                u = userRepository.findByUsernameIgnoreCase("PRINCIPAL").orElse(null);
            a.setFaculty(u);

            announcementRepository.save(a);
            return "Seeded CIE: " + a.getCieNumber();
        } catch (Exception e) {
            return "Error seeding: " + e.getMessage();
        }
    }

    @GetMapping("/notifications")
    public List<Notification> getNotifications() {
        return notificationRepository.findAll(); // Or filter by target role
    }
    /*
     * @GetMapping("/circulars")
     * public List<Object> getCirculars() {
     * return new ArrayList<>();
     * }
     */

    @GetMapping("/reports")
    public List<Object> getReports() {
        return new ArrayList<>();
    }

    @GetMapping("/grievances")
    public List<Object> getGrievances() {
        return new ArrayList<>();
    }

    @GetMapping("/students/{deptId}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public List<Student> getStudentsByDepartment(@PathVariable String deptId) {
        return studentRepository.findByDepartment(deptId);
    }
}
