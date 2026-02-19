package com.example.ia.payload.response;

import com.example.ia.entity.Student;
import java.util.Map;

public class StudentResponse {
    private Long id;
    private String regNo;
    private String name;
    private String department;
    private Integer semester;
    private String section;
    private String email;
    private String phone;
    private Map<String, Double> marks;

    // Mocked fields for UI
    private String feesStatus = "Paid";
    private String mentoringStatus = "Done";

    public StudentResponse(Student student, Map<String, Double> marks) {
        this.id = student.getId();
        this.regNo = student.getRegNo();
        this.name = student.getName();
        this.department = student.getDepartment();
        this.semester = student.getSemester();
        this.section = student.getSection();
        this.email = student.getEmail();
        this.phone = student.getPhone();
        this.marks = marks;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getRegNo() {
        return regNo;
    }

    public String getName() {
        return name;
    }

    public String getDepartment() {
        return department;
    }

    public Integer getSemester() {
        return semester;
    }

    public String getSection() {
        return section;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public Map<String, Double> getMarks() {
        return marks;
    }

    public String getFeesStatus() {
        return feesStatus;
    }

    public String getMentoringStatus() {
        return mentoringStatus;
    }
}
