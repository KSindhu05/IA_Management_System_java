package com.example.ia.payload.response;

public class FacultyResponse {
    private String name;
    private String department;
    private String subjects;
    private String email;

    public FacultyResponse() {
    }

    public FacultyResponse(String name, String department, String subjects, String email) {
        this.name = name;
        this.department = department;
        this.subjects = subjects;
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getSubjects() {
        return subjects;
    }

    public void setSubjects(String subjects) {
        this.subjects = subjects;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
