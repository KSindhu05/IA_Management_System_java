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

        java.util.List<com.example.ia.entity.Subject> subjects = subjectRepository
                .findByDepartmentAndSemester(student.getDepartment(), student.getSemester());

        java.util.Map<String, com.example.ia.payload.response.FacultyResponse> facultyMap = new java.util.HashMap<>();

        for (com.example.ia.entity.Subject sub : subjects) {
            String instructorName = sub.getInstructorName();
            if (instructorName == null || instructorName.isEmpty())
                continue;

            facultyMap.computeIfAbsent(instructorName, k -> {
                com.example.ia.entity.User user = userRepository.findByFullName(k).orElse(null);
                String email = user != null ? user.getEmail() : "";
                String dept = user != null ? user.getDepartment() : sub.getDepartment();
                return new com.example.ia.payload.response.FacultyResponse(k, dept, "", email);
            });

            // Append subject
            com.example.ia.payload.response.FacultyResponse fac = facultyMap.get(instructorName);
            if (fac.getSubjects().isEmpty()) {
                fac.setSubjects(sub.getName());
            } else {
                fac.setSubjects(fac.getSubjects() + ", " + sub.getName());
            }
        }

        return new java.util.ArrayList<>(facultyMap.values());
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
