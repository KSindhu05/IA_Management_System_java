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
import java.util.List;
import java.util.stream.Collectors;

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
        int count = 0;
        int low = 0;
        int top = 0;
        List<FacultyClassAnalytics.LowPerformer> lowList = new ArrayList<>();

        for (Subject sub : subjects) {
            List<CieMark> marks = cieMarkRepository.findBySubjectId(sub.getId());
            for (CieMark mark : marks) {
                if ("SUBMITTED".equals(mark.getStatus()) || "APPROVED".equals(mark.getStatus())) {
                    evaluated++;
                } else {
                    pending++;
                }

                if (mark.getMarks() != null) {
                    double score = mark.getMarks();
                    totalScore += score;
                    count++;

                    if (score < 20) { // Assuming 20/50 is threshold
                        low++;
                        if (lowList.size() < 5) {
                            lowList.add(new FacultyClassAnalytics.LowPerformer(
                                    mark.getStudent().getName(), sub.getName(), score));
                        }
                    }
                    if (score >= 45) { // Assuming 45/50 is top
                        top++;
                    }
                }
            }
        }

        double avg = count > 0 ? totalScore / count : 0;
        return new FacultyClassAnalytics(evaluated, pending, avg, low, top, lowList);
    }
}
