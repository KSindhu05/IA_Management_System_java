package com.example.ia.payload.request;

import lombok.Data;

@Data
public class MarkUpdateDto {
    private Long studentId;
    private Long subjectId;
    private String iaType; // CIE1, CIE2...
    private Double co1; // Marks
    private Double co2; // Ignored for now
}
