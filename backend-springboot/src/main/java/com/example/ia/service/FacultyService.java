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
        int evaluated = 0;
        int pending = 0;
        double totalScore = 0;
        int scoredCount = 0;
        int low = 0;
        int top = 0;
        Set<Long> uniqueStudents = new HashSet<>();
        Set<Long> evaluatedStudents = new HashSet<>();
        List<FacultyClassAnalytics.LowPerformer> lowList = new ArrayList<>();

        for (Subject sub : subjects) {
            List<CieMark> marks = cieMarkRepository.findBySubject_Id(sub.getId());
            for (CieMark mark : marks) {
                if (mark.getStudent() != null) {
                    uniqueStudents.add(mark.getStudent().getId());
                }

                // Only count marks that have actual values (not 0/null PENDING)
                boolean hasRealMark = mark.getMarks() != null && mark.getMarks() > 0;

                if (hasRealMark) {
                    double score = mark.getMarks();
                    totalScore += score;
                    scoredCount++;
                    evaluated++;

                    if (mark.getStudent() != null) {
                        evaluatedStudents.add(mark.getStudent().getId());
                    }

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

        // Pending = total unique students minus students who have at least one
        // evaluated mark
        pending = uniqueStudents.size() - evaluatedStudents.size();
        if (pending < 0)
            pending = 0;

        // Average as percentage of max marks (50)
        double avg = scoredCount > 0 ? Math.round((totalScore / scoredCount / 50.0 * 100) * 10.0) / 10.0 : 0;
        return new FacultyClassAnalytics(evaluated, pending, avg, low, top, uniqueStudents.size(), lowList);
    }
}
