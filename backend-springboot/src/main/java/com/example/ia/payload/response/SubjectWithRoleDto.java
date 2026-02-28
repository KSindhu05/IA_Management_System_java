package com.example.ia.payload.response;

/**
 * Wraps a Subject with the faculty's CIE role for that subject.
 * cieRole: "THEORY" = CIE-1,2,5 | "LAB" = CIE-3,4 | null = ALL
 */
public class SubjectWithRoleDto {
    private Long id;
    private String name;
    private String code;
    private String department;
    private Integer semester;
    private String instructorName;
    private Integer credits;
    private Integer maxMarks;
    private String cieRole; // THEORY, LAB, or null (ALL)

    public SubjectWithRoleDto() {
    }

    public SubjectWithRoleDto(com.example.ia.entity.Subject s, String cieRole) {
        this.id = s.getId();
        this.name = s.getName();
        this.code = s.getCode();
        this.department = s.getDepartment();
        this.semester = s.getSemester();
        this.instructorName = s.getInstructorName();
        this.credits = s.getCredits();
        this.maxMarks = s.getMaxMarks();
        this.cieRole = cieRole;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCode() {
        return code;
    }

    public String getDepartment() {
        return department;
    }

    public Integer getSemester() {
        return semester;
    }

    public String getInstructorName() {
        return instructorName;
    }

    public Integer getCredits() {
        return credits;
    }

    public Integer getMaxMarks() {
        return maxMarks;
    }

    public String getCieRole() {
        return cieRole;
    }
}
