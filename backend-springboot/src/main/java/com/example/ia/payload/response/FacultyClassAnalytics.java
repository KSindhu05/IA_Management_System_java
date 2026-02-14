package com.example.ia.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FacultyClassAnalytics {
    private int evaluated;
    private int pending;
    private double avgScore;
    private int lowPerformers;
    private int topPerformers;
    private List<LowPerformer> lowPerformersList;

    @Data
    @AllArgsConstructor
    public static class LowPerformer {
        private String name;
        private String subject;
        private double score;
    }
}
