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

import org.springframework.transaction.annotation.Transactional;
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
            // Username change — only if provided and not taken by someone else
            if (facultyData.getUsername() != null && !facultyData.getUsername().isBlank()) {
                String newUsername = facultyData.getUsername().trim();
                if (!newUsername.equals(faculty.getUsername())) {
                    if (userRepository.existsByUsername(newUsername)) {
                        return ResponseEntity.badRequest()
                                .<Object>body(Map.of("message", "Username '" + newUsername + "' is already taken."));
                    }
                    faculty.setUsername(newUsername);
                }
            }
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
    @Transactional
    public ResponseEntity<?> deleteFaculty(@PathVariable Long id) {
        return userRepository.findById(id).map(faculty -> {
            // 1. Clear instructorName in Subjects table
            if (faculty.getFullName() != null) {
                List<com.example.ia.entity.Subject> subjects = subjectRepository
                        .findByInstructorName(faculty.getFullName());
                for (com.example.ia.entity.Subject sub : subjects) {
                    sub.setInstructorName(null);
                }
                subjectRepository.saveAll(subjects);
            }

            // 2. Delete notifications for this user
            notificationRepository.deleteByUserId(faculty.getId());

            // 3. Delete user account
            userRepository.delete(faculty);

            return ResponseEntity.ok(Map.of("message", "Faculty deleted and associated data cleaned up"));
        }).orElse(ResponseEntity.notFound().build());
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

    @Autowired
    com.example.ia.repository.AttendanceRepository attendanceRepository;

    @Autowired
    com.example.ia.repository.NotificationRepository notificationRepository;

    @DeleteMapping("/students/{regNo}")
    @PreAuthorize("hasRole('HOD')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteStudent(@PathVariable String regNo) {
        // 1. Find Student Entity
        var studentOpt = studentRepository.findByRegNo(regNo);
        if (studentOpt.isPresent()) {
            com.example.ia.entity.Student student = studentOpt.get();
            // Delete dependent data for Student
            java.util.List<com.example.ia.entity.CieMark> marks = cieMarkRepository.findByStudent_Id(student.getId());
            if (!marks.isEmpty())
                cieMarkRepository.deleteAll(marks);

            java.util.List<com.example.ia.entity.Attendance> attendance = attendanceRepository
                    .findByStudentId(student.getId());
            if (!attendance.isEmpty())
                attendanceRepository.deleteAll(attendance);

            studentRepository.delete(student);
        }

        // 2. Find User Login
        var userOpt = userRepository.findByUsernameIgnoreCase(regNo);
        if (userOpt.isPresent()) {
            com.example.ia.entity.User user = userOpt.get();
            // Delete dependent data for User (Notifications)
            notificationRepository.deleteByUserId(user.getId());
            userRepository.delete(user);
        }

        if (studentOpt.isEmpty() && userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

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

    @PostMapping("/students/upload")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> uploadStudents(@RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("department") String department) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please select a CSV file to upload."));
        }

        int successCount = 0;
        int skipCount = 0;
        List<String> errors = new java.util.ArrayList<>();

        try (java.io.Reader reader = new java.io.InputStreamReader(file.getInputStream());
                com.opencsv.CSVReader csvReader = new com.opencsv.CSVReader(reader)) {

            List<String[]> records = csvReader.readAll();

            // Expected Header: RegNo, Name, Semester, Section, Email, Phone, ParentPhone
            // We skip header if present (simple check: if first row contains "RegNo")
            int startIndex = 0;
            if (!records.isEmpty() && records.get(0).length > 0 &&
                    (records.get(0)[0].equalsIgnoreCase("RegNo") || records.get(0)[0].equalsIgnoreCase("RollNo"))) {
                startIndex = 1;
            }

            for (int i = startIndex; i < records.size(); i++) {
                String[] record = records.get(i);
                // Ensure record has enough columns (at least RegNo and Name)
                if (record.length < 2)
                    continue;

                String regNo = record[0].trim();
                String name = record[1].trim();

                if (regNo.isEmpty() || name.isEmpty()) {
                    errors.add("Row " + (i + 1) + ": Missing RegNo or Name");
                    continue;
                }

                // Optional fields
                String semester = "1";
                String section = "A";
                String email = "";
                String phone = "";
                String parentPhone = "";
                String password = regNo; // Default

                // Check for "Sem / Sec" format (Reg No, Student Name, Sem / Sec, Parent Phone,
                // [Password])
                // 4-5 columns: RegNo[0], Name[1], Sem/Sec[2], ParentPhone[3], [Password[4]]
                if (record.length <= 5 && record[0].matches(".*\\d.*")
                        && (record.length > 2 && (record[2].contains("/") || record[2].contains("-")))) {
                    // Heuristic: If 4-5 columns and col 2 contains "/" or "-", assume it's the
                    // specific format
                    if (record.length > 2) {
                        String semSec = record[2].trim(); // e.g., "2 / B" or "2 - B"
                        if (semSec.contains("/")) {
                            String[] parts = semSec.split("/");
                            if (parts.length > 0)
                                semester = parts[0].trim();
                            if (parts.length > 1)
                                section = parts[1].trim();
                        } else if (semSec.contains("-")) {
                            String[] parts = semSec.split("-");
                            if (parts.length > 0)
                                semester = parts[0].trim();
                            if (parts.length > 1)
                                section = parts[1].trim();
                        }
                    }
                    if (record.length > 3)
                        parentPhone = record[3].trim();
                    if (record.length > 4 && !record[4].trim().isEmpty())
                        password = record[4].trim();

                    // Generate missing fields
                    email = regNo.toLowerCase() + "@student.college.edu";
                } else {
                    // Standard Format: RegNo, Name, Semester, Section, Email, Phone, ParentPhone,
                    // [Password]
                    semester = record.length > 2 ? record[2].trim() : "1";
                    section = record.length > 3 ? record[3].trim() : "A";
                    email = record.length > 4 ? record[4].trim() : "";
                    phone = record.length > 5 ? record[5].trim() : "";
                    parentPhone = record.length > 6 ? record[6].trim() : "";
                    if (record.length > 7 && !record[7].trim().isEmpty())
                        password = record[7].trim();
                }

                // Check if already exists
                if (studentRepository.findByRegNo(regNo).isPresent() || userRepository.existsByUsername(regNo)) {
                    skipCount++;
                    continue;
                }

                try {
                    // 1. Create User
                    User studentUser = new User();
                    studentUser.setUsername(regNo);
                    studentUser.setFullName(name);
                    studentUser.setEmail(email.isEmpty() ? regNo + "@student.college.edu" : email);
                    studentUser.setDepartment(department);
                    studentUser.setRole("STUDENT");
                    studentUser.setSemester(semester);
                    studentUser.setSection(section);
                    studentUser.setPassword(passwordEncoder.encode(password));
                    userRepository.save(studentUser);

                    // 2. Create Student
                    com.example.ia.entity.Student student = new com.example.ia.entity.Student();
                    student.setRegNo(regNo);
                    student.setName(name);
                    student.setDepartment(department);
                    try {
                        student.setSemester(Integer.parseInt(semester));
                    } catch (NumberFormatException e) {
                        student.setSemester(1);
                    }
                    student.setSection(section);
                    student.setEmail(email);
                    student.setPhone(phone);
                    student.setParentPhone(parentPhone);
                    studentRepository.save(student);

                    successCount++;
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + " (" + regNo + "): " + e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "File processed successfully");
            response.put("added", successCount);
            response.put("skipped", skipCount);
            response.put("errors", errors);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to parse CSV file: " + e.getMessage()));
        }
    }

    @DeleteMapping("/students/bulk")
    @PreAuthorize("hasRole('HOD')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteStudentsBulk(@RequestBody List<String> regNos) {
        if (regNos == null || regNos.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No students selected"));
        }

        int deletedCount = 0;
        for (String regNo : regNos) {
            // 1. Find Student Entity
            var studentOpt = studentRepository.findByRegNo(regNo);
            if (studentOpt.isPresent()) {
                com.example.ia.entity.Student student = studentOpt.get();
                // Delete dependent data
                java.util.List<com.example.ia.entity.CieMark> marks = cieMarkRepository
                        .findByStudent_Id(student.getId());
                if (!marks.isEmpty())
                    cieMarkRepository.deleteAll(marks);

                java.util.List<com.example.ia.entity.Attendance> attendance = attendanceRepository
                        .findByStudentId(student.getId());
                if (!attendance.isEmpty())
                    attendanceRepository.deleteAll(attendance);

                studentRepository.delete(student);
            }

            // 2. Find User Login
            var userOpt = userRepository.findByUsernameIgnoreCase(regNo);
            if (userOpt.isPresent()) {
                com.example.ia.entity.User user = userOpt.get();
                notificationRepository.deleteByUserId(user.getId());
                userRepository.delete(user);
            }

            deletedCount++;
        }

        return ResponseEntity.ok(Map.of("message", "Deleted " + deletedCount + " students successfully"));
    }
}
