package com.example.ia.controller;

import com.example.ia.entity.User;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    com.example.ia.repository.CieMarkRepository cieMarkRepository;

    @GetMapping("/overview")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public ResponseEntity<?> getOverview(@RequestParam String department) {
        List<com.example.ia.entity.Student> students = studentRepository.findByDepartment(department);
        List<com.example.ia.entity.Subject> subjects = subjectRepository.findByDepartment(department);
        long facultyCount = userRepository.countByRoleAndDepartment("FACULTY", department);

        // Collect all marks for all subjects in the department
        java.util.List<com.example.ia.entity.CieMark> allMarks = new java.util.ArrayList<>();
        for (com.example.ia.entity.Subject sub : subjects) {
            allMarks.addAll(cieMarkRepository.findBySubject_Id(sub.getId()));
        }

        // Filter out PENDING zero marks
        java.util.List<com.example.ia.entity.CieMark> validMarks = allMarks.stream()
                .filter(m -> m.getMarks() != null && !(m.getMarks() == 0 && "PENDING".equals(m.getStatus())))
                .collect(java.util.stream.Collectors.toList());

        // === 1. CIE Trend (average per CIE round across all subjects) ===
        Map<String, double[]> cieSums = new HashMap<>(); // {total, count}
        for (String cie : new String[] { "CIE1", "CIE2", "CIE3", "CIE4", "CIE5" }) {
            cieSums.put(cie, new double[] { 0, 0 });
        }
        for (com.example.ia.entity.CieMark m : validMarks) {
            String type = m.getCieType() != null ? m.getCieType().toUpperCase() : "";
            String target = null;
            if (cieSums.containsKey(type))
                target = type;
            else if (type.contains("1"))
                target = "CIE1";
            else if (type.contains("2"))
                target = "CIE2";
            else if (type.contains("3"))
                target = "CIE3";
            else if (type.contains("4"))
                target = "CIE4";
            else if (type.contains("5"))
                target = "CIE5";
            if (target != null) {
                cieSums.get(target)[0] += m.getMarks();
                cieSums.get(target)[1]++;
            }
        }
        Map<String, Object> cieTrend = new HashMap<>();
        for (String cie : new String[] { "CIE1", "CIE2", "CIE3", "CIE4", "CIE5" }) {
            double[] arr = cieSums.get(cie);
            cieTrend.put(cie, arr[1] > 0 ? Math.round((arr[0] / arr[1]) * 10.0) / 10.0 : 0);
        }

        // === 2. Grade Distribution ===
        int gradeA = 0, gradeB = 0, gradeC = 0, gradeD = 0, gradeF = 0;
        for (com.example.ia.entity.CieMark m : validMarks) {
            double percent = (m.getMarks() / 50.0) * 100;
            if (percent >= 80)
                gradeA++;
            else if (percent >= 60)
                gradeB++;
            else if (percent >= 40)
                gradeC++;
            else if (percent >= 20)
                gradeD++;
            else
                gradeF++;
        }
        Map<String, Object> gradeDistribution = new HashMap<>();
        gradeDistribution.put("labels",
                new String[] { "A (80%+)", "B (60-79%)", "C (40-59%)", "D (20-39%)", "F (<20%)" });
        gradeDistribution.put("data", new int[] { gradeA, gradeB, gradeC, gradeD, gradeF });

        // === 3. Subject-wise Performance with CIE breakdown ===
        java.util.List<Map<String, Object>> subjectPerfList = new java.util.ArrayList<>();
        for (com.example.ia.entity.Subject sub : subjects) {
            java.util.List<com.example.ia.entity.CieMark> sMarks = validMarks.stream()
                    .filter(m -> m.getSubject() != null && m.getSubject().getId().equals(sub.getId()))
                    .collect(java.util.stream.Collectors.toList());

            // Per-CIE averages
            Map<String, Object> averages = new HashMap<>();
            double grandTotal = 0;
            int grandCount = 0;
            int passCount = 0;
            int totalCount = 0;

            for (String cie : new String[] { "CIE1", "CIE2", "CIE3", "CIE4", "CIE5" }) {
                final String cieKey = cie;
                java.util.List<com.example.ia.entity.CieMark> cieMarks = sMarks.stream()
                        .filter(m -> {
                            String t = m.getCieType() != null ? m.getCieType().toUpperCase() : "";
                            return t.equals(cieKey) || (t.contains(cieKey.substring(3)));
                        })
                        .collect(java.util.stream.Collectors.toList());
                double cieTotal = cieMarks.stream().mapToDouble(m -> m.getMarks()).sum();
                int cieCount = cieMarks.size();
                double cieAvg = cieCount > 0 ? Math.round((cieTotal / cieCount) * 10.0) / 10.0 : 0;
                averages.put(cie, cieAvg);
                if (cieAvg > 0) {
                    grandTotal += cieAvg;
                    grandCount++;
                }

                for (com.example.ia.entity.CieMark cm : cieMarks) {
                    totalCount++;
                    if (cm.getMarks() >= 20)
                        passCount++;
                }
            }

            double overall = grandCount > 0 ? Math.round((grandTotal / grandCount) * 10.0) / 10.0 : 0;
            double passRate = totalCount > 0 ? Math.round((passCount * 100.0 / totalCount) * 10.0) / 10.0 : 0;

            Map<String, Object> item = new HashMap<>();
            item.put("id", sub.getId());
            item.put("name", sub.getName());
            item.put("averages", averages);
            item.put("overall", overall);
            item.put("passRate", Math.min(100, passRate));
            subjectPerfList.add(item);
        }

        // === 4. At-risk students (avg marks < 20) ===
        Map<Long, java.util.List<Double>> studentMarksMap = new HashMap<>();
        Map<Long, com.example.ia.entity.Student> studentObjMap = new HashMap<>();
        for (com.example.ia.entity.CieMark m : validMarks) {
            if (m.getStudent() != null) {
                Long sid = m.getStudent().getId();
                studentMarksMap.computeIfAbsent(sid, k -> new java.util.ArrayList<>()).add(m.getMarks());
                studentObjMap.putIfAbsent(sid, m.getStudent());
            }
        }
        java.util.List<Map<String, Object>> atRiskStudentsList = new java.util.ArrayList<>();
        for (Map.Entry<Long, java.util.List<Double>> entry : studentMarksMap.entrySet()) {
            double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
            if (avg < 20) {
                com.example.ia.entity.Student s = studentObjMap.get(entry.getKey());
                if (s != null) {
                    Map<String, Object> risk = new HashMap<>();
                    risk.put("id", s.getId());
                    risk.put("rollNo", s.getRegNo());
                    risk.put("name", s.getName());
                    risk.put("avgMarks", Math.round(avg * 10.0) / 10.0);
                    risk.put("issue", avg < 10 ? "Critical - Very Low Marks" : "Below Pass Threshold");
                    atRiskStudentsList.add(risk);
                }
            }
        }

        // === 5. Alerts ===
        java.util.List<Map<String, Object>> alerts = new java.util.ArrayList<>();
        int alertId = 1;
        if (atRiskStudentsList.size() > 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("id", alertId++);
            alert.put("type", "critical");
            alert.put("message", atRiskStudentsList.size() + " students are at risk with below-threshold marks");
            alert.put("date", java.time.LocalDate.now().toString());
            alerts.add(alert);
        }
        // Check for subjects with poor overall performance
        for (Map<String, Object> sp : subjectPerfList) {
            double overall = ((Number) sp.get("overall")).doubleValue();
            if (overall > 0 && overall < 25) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("id", alertId++);
                alert.put("type", "warning");
                alert.put("message", sp.get("name") + " has low class average (" + overall + "/50)");
                alert.put("date", java.time.LocalDate.now().toString());
                alerts.add(alert);
            }
        }
        // Pending submissions
        long pendingCount = allMarks.stream().filter(m -> "PENDING".equals(m.getStatus())).count();
        if (pendingCount > 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("id", alertId++);
            alert.put("type", "info");
            alert.put("message", pendingCount + " mark entries are still pending review");
            alert.put("date", java.time.LocalDate.now().toString());
            alerts.add(alert);
        }
        if (alerts.isEmpty()) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("id", 1);
            alert.put("type", "info");
            alert.put("message", "All department metrics are within acceptable range");
            alert.put("date", java.time.LocalDate.now().toString());
            alerts.add(alert);
        }

        // === Compute aggregate stats ===
        double deptAvg = 0;
        double deptPassRate = 0;
        int subjectsWithData = 0;
        for (Map<String, Object> sp : subjectPerfList) {
            double overall = ((Number) sp.get("overall")).doubleValue();
            double passRate = ((Number) sp.get("passRate")).doubleValue();
            if (overall > 0) {
                deptAvg += overall;
                deptPassRate += passRate;
                subjectsWithData++;
            }
        }
        if (subjectsWithData > 0) {
            deptAvg = Math.round((deptAvg / subjectsWithData) * 10.0) / 10.0;
            deptPassRate = Math.round((deptPassRate / subjectsWithData) * 10.0) / 10.0;
        }

        // === Build response ===
        Map<String, Object> data = new HashMap<>();
        data.put("totalStudents", students.size());
        data.put("facultyCount", facultyCount);
        data.put("cieTrend", cieTrend);
        data.put("subjectPerfList", subjectPerfList);
        data.put("gradeDistribution", gradeDistribution);
        data.put("alerts", alerts);
        data.put("atRiskStudents", atRiskStudentsList);
        data.put("deptAverage", deptAvg);
        data.put("passPercentage", Math.min(100, deptPassRate));
        data.put("atRiskCount", atRiskStudentsList.size());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<User> getFaculty(@RequestParam String department) {
        return userRepository.findByRoleAndDepartment("FACULTY", department);
    }

    @PostMapping("/faculty")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> createFaculty(@RequestBody User facultyData) {
        if (userRepository.existsByUsername(facultyData.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }
        User faculty = new User();
        faculty.setUsername(facultyData.getUsername());
        faculty.setFullName(facultyData.getFullName());
        faculty.setEmail(facultyData.getEmail());
        faculty.setDepartment(facultyData.getDepartment());
        faculty.setDesignation(facultyData.getDesignation());
        faculty.setSemester(facultyData.getSemester());
        faculty.setSection(facultyData.getSection());
        faculty.setSubjects(facultyData.getSubjects());
        faculty.setRole("FACULTY");
        faculty.setPassword(passwordEncoder.encode("password"));
        userRepository.save(faculty);
        return ResponseEntity.ok(faculty);
    }

    @PutMapping("/faculty/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> updateFaculty(@PathVariable Long id, @RequestBody User facultyData) {
        return userRepository.findById(id).map(faculty -> {
            if (facultyData.getFullName() != null)
                faculty.setFullName(facultyData.getFullName());
            if (facultyData.getEmail() != null)
                faculty.setEmail(facultyData.getEmail());
            if (facultyData.getDesignation() != null)
                faculty.setDesignation(facultyData.getDesignation());
            if (facultyData.getSemester() != null)
                faculty.setSemester(facultyData.getSemester());
            if (facultyData.getSection() != null)
                faculty.setSection(facultyData.getSection());
            if (facultyData.getSubjects() != null)
                faculty.setSubjects(facultyData.getSubjects());
            if (facultyData.getDepartment() != null)
                faculty.setDepartment(facultyData.getDepartment());
            userRepository.save(faculty);
            return ResponseEntity.ok(faculty);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/faculty/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> deleteFaculty(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Faculty deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    // ========== STUDENT MANAGEMENT ==========

    @PostMapping("/students")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, String> data) {
        String regNo = data.get("regNo");
        String name = data.get("name");
        String department = data.get("department");
        String semester = data.getOrDefault("semester", "1");
        String section = data.getOrDefault("section", "A");
        String email = data.getOrDefault("email", "");
        String phone = data.getOrDefault("phone", "");
        String parentPhone = data.getOrDefault("parentPhone", "");
        String password = data.getOrDefault("password", "password123");

        if (regNo == null || regNo.isBlank() || name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reg No and Name are required"));
        }

        // Check for duplicate regNo in students table
        if (studentRepository.findByRegNo(regNo).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student with this Reg No already exists"));
        }

        // Check for duplicate username in users table
        if (userRepository.existsByUsername(regNo)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username (Reg No) already exists in users"));
        }

        try {
            // 1. Create User entity (for login)
            User studentUser = new User();
            studentUser.setUsername(regNo);
            studentUser.setFullName(name);
            studentUser.setEmail(email);
            studentUser.setDepartment(department);
            studentUser.setRole("STUDENT");
            studentUser.setSemester(semester);
            studentUser.setSection(section);
            studentUser.setPassword(passwordEncoder.encode(password));
            userRepository.save(studentUser);

            // 2. Create Student entity (for academic data)
            com.example.ia.entity.Student student = new com.example.ia.entity.Student();
            student.setRegNo(regNo);
            student.setName(name);
            student.setDepartment(department);
            student.setSemester(Integer.parseInt(semester));
            student.setSection(section);
            student.setEmail(email);
            student.setPhone(phone);
            student.setParentPhone(parentPhone);
            studentRepository.save(student);

            java.util.HashMap<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Student created successfully");
            response.put("studentId", student.getId());
            response.put("userId", studentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error creating student: " + e.getMessage()));
        }
    }

    @DeleteMapping("/students/{regNo}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> deleteStudent(@PathVariable String regNo) {
        var studentOpt = studentRepository.findByRegNo(regNo);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        studentRepository.delete(studentOpt.get());

        // Also delete the User login account
        var userOpt = userRepository.findByUsernameIgnoreCase(regNo);
        userOpt.ifPresent(userRepository::delete);

        return ResponseEntity.ok(Map.of("message", "Student deleted successfully"));
    }

    // ========== CREDENTIAL MANAGEMENT ==========

    @PutMapping("/credentials/reset")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String newPassword = data.get("newPassword");

        if (username == null || newPassword == null || newPassword.length() < 4) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username and a password (min 4 chars) are required"));
        }

        User targetUser = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.notFound().build();
        }

        // Only allow resetting for STUDENT or FACULTY roles
        if (!"STUDENT".equals(targetUser.getRole()) && !"FACULTY".equals(targetUser.getRole())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Can only reset credentials for students or faculty"));
        }

        targetUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(targetUser);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully for " + username));
    }
}
