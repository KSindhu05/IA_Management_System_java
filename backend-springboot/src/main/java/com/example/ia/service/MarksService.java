package com.example.ia.service;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MarksService {
    @Autowired
    private CieMarkRepository cieMarkRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Transactional
    public void submitMarks(Long subjectId, String cieType, String facultyUsername) {
        // Find all marks for this subject and CIE type and update status to SUBMITTED
        // In a real app, strict validation against faculty assignment would be here
        List<CieMark> marks = cieMarkRepository.findBySubjectId(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType)) {
                mark.setStatus("SUBMITTED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    public List<CieMark> getMarksBySubject(Long subjectId) {
        return cieMarkRepository.findBySubjectId(subjectId);
    }

    @Transactional
    public void updateBatchMarks(List<CieMark> marksPayload) {
        for (CieMark payload : marksPayload) {
            Optional<CieMark> existing = cieMarkRepository.findByStudentIdAndSubjectIdAndCieType(
                    payload.getStudent().getId(),
                    payload.getSubject().getId(),
                    payload.getCieType());

            if (existing.isPresent()) {
                CieMark mark = existing.get();
                mark.setMarks(payload.getMarks());
                cieMarkRepository.save(mark);
            } else {
                // Determine status. If payload has status use it, else default PENDING
                if (payload.getStatus() == null)
                    payload.setStatus("PENDING");
                cieMarkRepository.save(payload);
            }
        }
    }

    // HOD Features
    public List<CieMark> getPendingApprovals(String department) {
        return cieMarkRepository.findByStatusAndSubjectDepartment("SUBMITTED", department);
    }

    @Transactional
    public void approveMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubjectId(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType) && "SUBMITTED".equals(mark.getStatus())) {
                mark.setStatus("APPROVED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    @Transactional
    public void rejectMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubjectId(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType) && "SUBMITTED".equals(mark.getStatus())) {
                mark.setStatus("REJECTED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    @Transactional(readOnly = true)
    public List<CieMark> getMarksByStudentUsername(String username) {
        // Username for student is their RegNo
        Student student = studentRepository.findByRegNo(username).orElse(null);
        if (student == null) {
            return List.of();
        }
        return cieMarkRepository.findByStudentId(student.getId());
    }
}
