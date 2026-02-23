package com.example.ia.payload.request;

public class MarkUpdateDto {
    private Long studentId;
    private Long subjectId;
    private String iaType; // CIE1, CIE2...
    private Double co1; // Marks (out of 50)
    private Double attendance; // Attendance percentage (0-100)

    public MarkUpdateDto() {
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public String getIaType() {
        return iaType;
    }

    public void setIaType(String iaType) {
        this.iaType = iaType;
    }

    public Double getCo1() {
        return co1;
    }

    public void setCo1(Double co1) {
        this.co1 = co1;
    }

    public Double getAttendance() {
        return attendance;
    }

    public void setAttendance(Double attendance) {
        this.attendance = attendance;
    }
}
