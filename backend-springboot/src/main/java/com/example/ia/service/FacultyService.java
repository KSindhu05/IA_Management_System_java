package com.example.ia.service;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.Subject;
import com.example.ia.entity.User;
import com.example.ia.payload.response.FacultyClassAnalytics;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class FacultyService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private CieMarkRepository cieMarkRepository;

    public List<Subject> getSubjectsForFaculty(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null)
            return List.of();

        // Assuming subject instructorName matches user fullName
        return subjectRepository.findByInstructorName(user.getFullName());
    }

    public FacultyClassAnalytics getAnalytics(String username) {
        List<Subject> subjects = getSubjectsForFaculty(username);
        double totalScore = 0;
        int scoredCount = 0;
        int low = 0;
        int top = 0;
        Set<Long> uniqueStudents = new HashSet<>();
        List<FacultyClassAnalytics.LowPerformer> lowList = new ArrayList<>();

        for (Subject sub : subjects) {
            List<CieMark> marks = cieMarkRepository.findBySubject_Id(sub.getId());
            for (CieMark mark : marks) {
                // Every student with a mark record is counted as evaluated
                if (mark.getStudent() != null) {
                    uniqueStudents.add(mark.getStudent().getId());
                }

                // For avg/low/top calculations, only use marks with actual values > 0
                if (mark.getMarks() != null && mark.getMarks() > 0) {
                    double score = mark.getMarks();
                    totalScore += score;
                    scoredCount++;

                    if (score < 20) {
                        low++;
                        if (lowList.size() < 5) {
                            lowList.add(new FacultyClassAnalytics.LowPerformer(
                                    mark.getStudent().getName(), sub.getName(), score));
                        }
                    }
                    if (score >= 40) {
                        top++;
                    }
                }
            }
        }

        // All students with records are evaluated, pending = 0
        int evaluated = uniqueStudents.size();
        int pending = 0;

        // Average as percentage of max marks (50)
        double avg = scoredCount > 0 ? Math.round((totalScore / scoredCount / 50.0 * 100) * 10.0) / 10.0 : 0;
        return new FacultyClassAnalytics(evaluated, pending, avg, low, top, uniqueStudents.size(), lowList);
    }
}
