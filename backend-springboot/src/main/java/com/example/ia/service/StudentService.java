package com.example.ia.service;

import com.example.ia.entity.Student;
import com.example.ia.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {
    @Autowired
    StudentRepository studentRepository;

    @Autowired
    private com.example.ia.repository.SubjectRepository subjectRepository;

    @Autowired
    private com.example.ia.repository.UserRepository userRepository;

    public List<Student> getAllStudents(String department) {
        if (department != null && !department.equals("all")) {
            return studentRepository.findByDepartment(department);
        }
        return studentRepository.findAll();
    }

    public java.util.Optional<Student> getStudentByRegNo(String regNo) {
        return studentRepository.findByRegNo(regNo);
    }

    public java.util.List<com.example.ia.payload.response.FacultyResponse> getFacultyForStudent(String username) {
        Student student = studentRepository.findByRegNo(username).orElse(null);
        if (student == null)
            return java.util.List.of();

        // 1. Get all subjects for student's department and semester
        java.util.List<com.example.ia.entity.Subject> semesterSubjects = subjectRepository
                .findByDepartmentAndSemester(student.getDepartment(), student.getSemester());

        java.util.Set<String> semesterSubjectNames = semesterSubjects.stream()
                .map(com.example.ia.entity.Subject::getName)
                .collect(java.util.stream.Collectors.toSet());

        // 2. Get all faculty in the department
        java.util.List<com.example.ia.entity.User> departmentFaculty = userRepository
                .findByRoleAndDepartment("FACULTY", student.getDepartment());

        java.util.List<com.example.ia.payload.response.FacultyResponse> response = new java.util.ArrayList<>();

        String studentSection = student.getSection() != null ? student.getSection().trim() : "";

        for (com.example.ia.entity.User faculty : departmentFaculty) {
            // Check section
            boolean sectionMatch = false;
            String facSections = faculty.getSection();
            if (facSections == null || facSections.isBlank()) {
                sectionMatch = true; // No restriction means see all
            } else {
                java.util.List<String> sections = java.util.Arrays.stream(facSections.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(java.util.stream.Collectors.toList());
                if (sections.contains(studentSection)) {
                    sectionMatch = true;
                }
            }

            if (!sectionMatch)
                continue;

            // Check subjects
            String facSubjectsStr = faculty.getSubjects();
            if (facSubjectsStr == null || facSubjectsStr.isBlank())
                continue;

            java.util.List<String> matchedSubjects = java.util.Arrays.stream(facSubjectsStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .filter(s -> semesterSubjectNames.contains(s))
                    .collect(java.util.stream.Collectors.toList());

            if (!matchedSubjects.isEmpty()) {
                String subjectsDisplay = String.join(", ", matchedSubjects);
                response.add(new com.example.ia.payload.response.FacultyResponse(
                        faculty.getFullName(),
                        faculty.getDepartment(),
                        subjectsDisplay,
                        faculty.getEmail()));
            }
        }

        return response;
    }

    @Autowired
    private com.example.ia.repository.CieMarkRepository cieMarkRepository;

    public List<com.example.ia.payload.response.StudentResponse> getStudentsWithAnalytics(String department) {
        List<Student> students;
        if (department != null && !department.equals("all")) {
            students = studentRepository.findByDepartment(department);
        } else {
            students = studentRepository.findAll();
        }

        return students.stream().map(student -> {
            List<com.example.ia.entity.CieMark> marksList = cieMarkRepository.findByStudent_Id(student.getId());
            java.util.Map<String, Double> marksMap = new java.util.HashMap<>();

            for (com.example.ia.entity.CieMark mark : marksList) {
                // Determine key based on cieType (e.g., CIE1, CIE2)
                String key = mark.getCieType().toLowerCase().replace(" ", "");
                marksMap.put(key, mark.getMarks());
            }

            return new com.example.ia.payload.response.StudentResponse(student, marksMap);
        }).collect(java.util.stream.Collectors.toList());
    }
}
