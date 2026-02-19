package com.example.ia.payload.response;

import java.util.List;

public class FacultyClassAnalytics {
    private int evaluated;
    private int pending;
    private double avgScore;
    private int lowPerformers;
    private int topPerformers;
    private int totalStudents;
    private List<LowPerformer> lowPerformersList;

    public FacultyClassAnalytics() {
    }

    public FacultyClassAnalytics(int evaluated, int pending, double avgScore, int lowPerformers, int topPerformers,
            int totalStudents, List<LowPerformer> lowPerformersList) {
        this.evaluated = evaluated;
        this.pending = pending;
        this.avgScore = avgScore;
        this.lowPerformers = lowPerformers;
        this.topPerformers = topPerformers;
        this.totalStudents = totalStudents;
        this.lowPerformersList = lowPerformersList;
    }

    public int getEvaluated() {
        return evaluated;
    }

    public void setEvaluated(int evaluated) {
        this.evaluated = evaluated;
    }

    public int getPending() {
        return pending;
    }

    public void setPending(int pending) {
        this.pending = pending;
    }

    public double getAvgScore() {
        return avgScore;
    }

    public void setAvgScore(double avgScore) {
        this.avgScore = avgScore;
    }

    public int getLowPerformers() {
        return lowPerformers;
    }

    public void setLowPerformers(int lowPerformers) {
        this.lowPerformers = lowPerformers;
    }

    public int getTopPerformers() {
        return topPerformers;
    }

    public void setTopPerformers(int topPerformers) {
        this.topPerformers = topPerformers;
    }

    public List<LowPerformer> getLowPerformersList() {
        return lowPerformersList;
    }

    public void setLowPerformersList(List<LowPerformer> lowPerformersList) {
        this.lowPerformersList = lowPerformersList;
    }

    public int getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(int totalStudents) {
        this.totalStudents = totalStudents;
    }

    public static class LowPerformer {
        private String name;
        private String subject;
        private double score;

        public LowPerformer() {
        }

        public LowPerformer(String name, String subject, double score) {
            this.name = name;
            this.subject = subject;
            this.score = score;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public double getScore() {
            return score;
        }

        public void setScore(double score) {
            this.score = score;
        }
    }
}
