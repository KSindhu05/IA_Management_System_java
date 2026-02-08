package com.ia.management.service;

import com.ia.management.model.CIEMark;
import com.ia.management.model.Student;
import com.ia.management.model.Subject;
import com.ia.management.repository.CIEMarkRepository;
import com.ia.management.repository.StudentRepository;
import com.ia.management.repository.SubjectRepository;
import com.ia.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.ia.management.model.PendingApprovalDTO;

@Service
public class MarksService {

    @Autowired
    private CIEMarkRepository cieMarkRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    public List<CIEMark> getMarksForSubject(Long subjectId) {
        return cieMarkRepository.findBySubjectId(subjectId);
    }

    public List<CIEMark> getMarksByStudentAndSubject(Long studentId, Long subjectId) {
        return cieMarkRepository.findByStudentIdAndSubjectId(studentId, subjectId);
    }

    @Transactional
    public void submitMarks(Long subjectId, String cieTypeStr, String facultyUsername) {
        CIEMark.CIEType cieType = CIEMark.CIEType.valueOf(cieTypeStr);
        List<CIEMark> marks = cieMarkRepository.findBySubjectIdAndCieType(subjectId, cieType);
        if (marks.isEmpty())
            return;

        marks.forEach(m -> m.setStatus(CIEMark.MarkStatus.SUBMITTED));
        cieMarkRepository.saveAll(marks);

        Subject subject = subjectRepository.findById(subjectId).orElseThrow();
        notificationService.notifyHODMarksSubmitted(subject, cieTypeStr, facultyUsername);
    }

    @Transactional
    public void approveMarks(Long subjectId, String cieTypeStr, String hodUsername) {
        CIEMark.CIEType cieType = CIEMark.CIEType.valueOf(cieTypeStr);
        List<CIEMark> marks = cieMarkRepository.findBySubjectIdAndCieType(subjectId, cieType);
        if (marks.isEmpty())
            return;

        marks.forEach(m -> m.setStatus(CIEMark.MarkStatus.APPROVED));
        cieMarkRepository.saveAll(marks);

        Subject subject = subjectRepository.findById(subjectId).orElseThrow();
    }

    @Transactional
    public void rejectMarks(Long subjectId, String cieTypeStr, String hodUsername) {
        CIEMark.CIEType cieType = CIEMark.CIEType.valueOf(cieTypeStr);
        List<CIEMark> marks = cieMarkRepository.findBySubjectIdAndCieType(subjectId, cieType);
        if (marks.isEmpty())
            return;

        marks.forEach(m -> m.setStatus(CIEMark.MarkStatus.REJECTED));
        cieMarkRepository.saveAll(marks);

        Subject subject = subjectRepository.findById(subjectId).orElseThrow();
    }

    @Transactional
    public CIEMark updateMark(Long studentId, Long subjectId, String cieTypeStr, Double co1, Double co2) {
        CIEMark.CIEType cieType = CIEMark.CIEType.valueOf(cieTypeStr);

        Optional<CIEMark> check = cieMarkRepository.findByStudentIdAndSubjectIdAndCieType(studentId, subjectId,
                cieType);
        if (check.isPresent()) {
            CIEMark.MarkStatus status = check.get().getStatus();
            if (status == CIEMark.MarkStatus.SUBMITTED || status == CIEMark.MarkStatus.APPROVED) {
                throw new RuntimeException("Marks are LOCKED (Status: " + status + "). Cannot edit.");
            }
        }

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Optional<CIEMark> existing = cieMarkRepository.findByStudentIdAndSubjectIdAndCieType(studentId, subjectId,
                cieType);

        CIEMark mark;
        if (existing.isPresent()) {
            mark = existing.get();
        } else {
            mark = new CIEMark();
            mark.setStudent(student);
            mark.setSubject(subject);
            mark.setCieType(cieType);
        }

        mark.setCo1Score(co1);
        mark.setCo2Score(co2);

        double total = (co1 != null ? co1 : 0) + (co2 != null ? co2 : 0);
        int maxTotal = subject.getMaxMarks() != null ? subject.getMaxMarks() : 50;
        if (total > maxTotal)
            total = maxTotal;

        mark.setTotalScore(total);

        return cieMarkRepository.save(mark);
    }

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<CIEMark> getMyMarks(String username) {
        com.ia.management.model.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != com.ia.management.model.User.Role.STUDENT) {
            throw new RuntimeException("User is not a student");
        }

        String regNo = user.getAssociatedId();
        Student student = studentRepository.findByRegNo(regNo)
                .orElseThrow(() -> new RuntimeException("Student record not found for RegNo: " + regNo));

        // Only return marks that have been APPROVED by HOD
        return cieMarkRepository.findByStudentIdAndStatus(student.getId(), CIEMark.MarkStatus.APPROVED);
    }

    @Transactional
    public void updateMarksBatch(List<Map<String, Object>> marksData) {
        for (Map<String, Object> entry : marksData) {
            try {
                Long studentId = Long.valueOf(entry.get("studentId").toString());
                Long subjectId = Long.valueOf(entry.get("subjectId").toString());
                String cieType = (String) entry.get("cieType");
                if (cieType == null)
                    cieType = (String) entry.get("iaType");

                Double co1 = entry.get("co1") != null ? Double.valueOf(entry.get("co1").toString()) : 0.0;
                Double co2 = entry.get("co2") != null ? Double.valueOf(entry.get("co2").toString()) : 0.0;

                updateMark(studentId, subjectId, cieType, co1, co2);
            } catch (Exception e) {
                throw new RuntimeException("Error processing batch at studentId=" + entry.get("studentId"), e);
            }
        }
    }

    public List<PendingApprovalDTO> getPendingSubmissions(String department) {
        List<CIEMark> submittedMarks = cieMarkRepository.findByStatusAndSubject_Department(
                CIEMark.MarkStatus.SUBMITTED, department);

        Map<String, List<CIEMark>> grouped = submittedMarks.stream()
                .collect(Collectors.groupingBy(m -> m.getSubject().getId() + "_" + m.getCieType().name()));

        List<PendingApprovalDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<CIEMark>> entry : grouped.entrySet()) {
            List<CIEMark> marks = entry.getValue();
            if (marks.isEmpty())
                continue;

            CIEMark first = marks.get(0);
            Subject subject = first.getSubject();

            List<PendingApprovalDTO.StudentMarkDTO> studentMarks = marks.stream()
                    .map(m -> new PendingApprovalDTO.StudentMarkDTO(
                            m.getStudent().getId(),
                            m.getStudent().getRegNo(),
                            m.getStudent().getName(),
                            m.getTotalScore()))
                    .collect(Collectors.toList());

            PendingApprovalDTO dto = new PendingApprovalDTO(
                    subject.getId(),
                    subject.getName(),
                    subject.getCode(),
                    first.getCieType().name(),
                    "Faculty",
                    marks.size(),
                    null,
                    studentMarks);
            result.add(dto);
        }

        return result;
    }
}
