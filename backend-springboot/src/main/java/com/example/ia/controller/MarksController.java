package com.example.ia.controller;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.payload.request.MarkUpdateDto;
import com.example.ia.payload.response.MessageResponse;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.service.MarksService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/marks")
public class MarksController {

    @Autowired
    MarksService marksService;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @GetMapping("/subject/{subjectId}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<CieMark> getMarksBySubject(@PathVariable Long subjectId) {
        return marksService.getMarksBySubject(subjectId);
    }

    @GetMapping("/my-marks")
    @PreAuthorize("hasRole('STUDENT')")
    public List<CieMark> getMyMarks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return marksService.getMarksByStudentUsername(username);
    }

    @PostMapping("/update/batch")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> updateBatchMarks(@RequestBody List<MarkUpdateDto> markDtos) {
        List<CieMark> marksToSave = new ArrayList<>();

        for (MarkUpdateDto dto : markDtos) {
            Student student = studentRepository.findById(dto.getStudentId()).orElse(null);
            Subject subject = subjectRepository.findById(dto.getSubjectId()).orElse(null);

            if (student != null && subject != null) {
                CieMark mark = new CieMark();
                mark.setStudent(student);
                mark.setSubject(subject);
                mark.setCieType(dto.getIaType());
                mark.setMarks(dto.getCo1());
                marksToSave.add(mark);
            }
        }

        marksService.updateBatchMarks(marksToSave);
        return ResponseEntity.ok(new MessageResponse("Marks updated successfully"));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> submitMarks(@RequestParam Long subjectId, @RequestParam String cieType) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        marksService.submitMarks(subjectId, cieType, username);
        return ResponseEntity.ok(new MessageResponse("Marks submitted successfully"));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('HOD')")
    public List<CieMark> getPendingApprovals(@RequestParam String department) {
        return marksService.getPendingApprovals(department);
    }

    @PostMapping("/approve")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> approveMarks(@RequestBody ApprovalRequest request) {
        marksService.approveMarks(request.getSubjectId(), request.getIaType());
        return ResponseEntity.ok(new MessageResponse("Marks approved"));
    }

    // Inner DTO for approval
    @lombok.Data
    static class ApprovalRequest {
        private Long subjectId;
        private String iaType;
    }
}
