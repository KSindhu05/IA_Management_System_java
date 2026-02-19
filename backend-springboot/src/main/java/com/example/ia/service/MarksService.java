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
        // Only submit marks that have been entered (marks != null)
        // 0 is valid (faculty may give 0), but null means not yet entered
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType)
                    && mark.getMarks() != null) {
                mark.setStatus("SUBMITTED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    public List<CieMark> getMarksBySubject(Long subjectId) {
        return cieMarkRepository.findBySubject_Id(subjectId);
    }

    @Transactional
    public void updateBatchMarks(List<CieMark> marksPayload) {
        for (CieMark payload : marksPayload) {
            Optional<CieMark> existing = cieMarkRepository.findByStudent_IdAndSubject_IdAndCieType(
                    payload.getStudent().getId(),
                    payload.getSubject().getId(),
                    payload.getCieType());

            if (existing.isPresent()) {
                CieMark mark = existing.get();
                mark.setMarks(payload.getMarks());
                // Reset status to PENDING so faculty can re-submit (handles REJECTED re-edits)
                mark.setStatus("PENDING");
                cieMarkRepository.save(mark);
            } else {
                // Only create a new record if there are actual marks to save
                // Don't create empty placeholders for cleared fields
                if (payload.getMarks() != null) {
                    if (payload.getStatus() == null)
                        payload.setStatus("PENDING");
                    cieMarkRepository.save(payload);
                }
            }
        }
    }

    // HOD Features
    public List<CieMark> getPendingApprovals(String department) {
        return cieMarkRepository.findByStatusAndSubject_Department("SUBMITTED", department);
    }

    @Transactional
    public void approveMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType) && "SUBMITTED".equals(mark.getStatus())) {
                mark.setStatus("APPROVED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    @Transactional
    public void rejectMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);
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
        return cieMarkRepository.findByStudent_Id(student.getId())
                .stream()
                .filter(m -> !"PENDING".equalsIgnoreCase(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CieMark> getMarksByStudentId(Long studentId) {
        return cieMarkRepository.findByStudent_Id(studentId);
    }

    @Transactional
    public void unlockMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);

        // Get all students who already have marks for this CIE type
        java.util.Set<Long> studentsWithMarks = new java.util.HashSet<>();

        // Update existing marks to PENDING so faculty can edit them
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType)) {
                mark.setStatus("PENDING");
                if (mark.getStudent() != null) {
                    studentsWithMarks.add(mark.getStudent().getId());
                }
            }
        });
        cieMarkRepository.saveAll(marks);

        // For CIE types that don't have records yet (e.g. CIE-2 to CIE-5),
        // create PENDING placeholders with NULL marks (not 0) so the frontend
        // knows these CIE types are unlocked for editing
        java.util.Set<Long> allStudentIds = new java.util.HashSet<>();
        marks.forEach(mark -> {
            if (mark.getStudent() != null) {
                allStudentIds.add(mark.getStudent().getId());
            }
        });

        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        if (subject != null) {
            for (Long studentId : allStudentIds) {
                if (!studentsWithMarks.contains(studentId)) {
                    Student student = studentRepository.findById(studentId).orElse(null);
                    if (student != null) {
                        CieMark newMark = new CieMark();
                        newMark.setStudent(student);
                        newMark.setSubject(subject);
                        newMark.setCieType(cieType);
                        newMark.setMarks(null); // NULL not 0 — won't display as "0"
                        newMark.setStatus("PENDING");
                        cieMarkRepository.save(newMark);
                    }
                }
            }
        }
    }
}
