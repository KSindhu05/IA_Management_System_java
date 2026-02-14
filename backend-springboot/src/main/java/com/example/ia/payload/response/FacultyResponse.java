package com.example.ia.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FacultyResponse {
    private String name;
    private String department;
    private String subjects;
    private String email;
}
