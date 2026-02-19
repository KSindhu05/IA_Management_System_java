package com.example.ia.controller;

import com.example.ia.entity.Announcement;
import com.example.ia.entity.Notification;
import com.example.ia.entity.Subject;
import com.example.ia.entity.User;
import com.example.ia.repository.AnnouncementRepository;
import com.example.ia.repository.NotificationRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import com.example.ia.service.CieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/cie")
public class CieController {

    @Autowired
    CieService cieService;

    @Autowired
    AnnouncementRepository announcementRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    NotificationRepository notificationRepository;

    // ========== STUDENT ENDPOINTS ==========

    @GetMapping("/student/announcements")
    @PreAuthorize("hasRole('STUDENT')")
    public List<Announcement> getStudentAnnouncements() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return cieService.getStudentAnnouncements(username);
    }

    @GetMapping("/student/notifications")
    @PreAuthorize("hasRole('STUDENT')")
    public List<Notification> getStudentNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return cieService.getStudentNotifications(username);
    }

    // ========== FACULTY ENDPOINTS ==========

    @GetMapping("/faculty/schedules")
    @PreAuthorize("hasRole('FACULTY')")
    public List<Announcement> getFacultySchedules() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return cieService.getFacultySchedules(username);
    }

    @PostMapping("/faculty/announcements")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> createFacultyAnnouncement(@RequestBody Map<String, Object> data) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User faculty = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (faculty == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Faculty not found"));

        Long subjectId = Long.valueOf(data.get("subjectId").toString());
        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        if (subject == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Subject not found"));

        Announcement ann = new Announcement();
        ann.setSubject(subject);
        ann.setFaculty(faculty);
        ann.setCieNumber(data.getOrDefault("cieNumber", "CIE-1").toString());
        ann.setScheduledDate(data.containsKey("scheduledDate") ? LocalDate.parse(data.get("scheduledDate").toString())
                : LocalDate.now().plusDays(7));
        ann.setStartTime(data.getOrDefault("startTime", "10:00 AM").toString());
        ann.setDurationMinutes(
                data.containsKey("durationMinutes") ? Integer.parseInt(data.get("durationMinutes").toString()) : 60);
        ann.setExamRoom(data.getOrDefault("examRoom", "TBD").toString());
        ann.setStatus("SCHEDULED");

        announcementRepository.save(ann);
        return ResponseEntity.ok(ann);
    }

    @PutMapping("/faculty/announcements/syllabus")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> updateSyllabus(@RequestBody Map<String, Object> data) {
        Long subjectId = Long.valueOf(data.get("subjectId").toString());
        String cieNumber = data.get("cieNumber").toString();
        String syllabus = data.getOrDefault("syllabusCoverage", "").toString();

        // Find the existing announcement for this subject+CIE
        List<Announcement> matches = announcementRepository.findBySubjectIdIn(List.of(subjectId));
        Announcement existing = matches.stream()
                .filter(a -> cieNumber.equals(a.getCieNumber()))
                .findFirst()
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "No CIE schedule found for this subject and CIE number. HOD must schedule it first."));
        }

        existing.setSyllabusCoverage(syllabus);
        announcementRepository.save(existing);
        return ResponseEntity.ok(existing);
    }

    @PutMapping("/hod/announcements/syllabus")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> updateSyllabusHod(@RequestBody Map<String, Object> data) {
        Long subjectId = Long.valueOf(data.get("subjectId").toString());
        String cieNumber = data.get("cieNumber").toString();
        String syllabus = data.getOrDefault("syllabusCoverage", "").toString();

        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        if (subject == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Subject not found."));
        }

        List<Announcement> matches = announcementRepository.findBySubjectIdIn(List.of(subjectId));
        Announcement existing = matches.stream()
                .filter(a -> cieNumber.equals(a.getCieNumber()))
                .findFirst()
                .orElse(null);

        if (existing == null) {
            // Create a new announcement with syllabus
            Announcement ann = new Announcement();
            ann.setSubject(subject);
            ann.setCieNumber(cieNumber);
            ann.setSyllabusCoverage(syllabus);
            ann.setScheduledDate(java.time.LocalDate.now());
            ann.setStartTime("TBD");
            ann.setDurationMinutes(60);
            ann.setExamRoom("TBD");
            ann.setStatus("SYLLABUS_ONLY");
            announcementRepository.save(ann);
            return ResponseEntity.ok(ann);
        }

        existing.setSyllabusCoverage(syllabus);
        announcementRepository.save(existing);
        return ResponseEntity.ok(existing);
    }

    @GetMapping("/faculty/announcements/details")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> getFacultyAnnouncementDetails(
            @RequestParam Long subjectId,
            @RequestParam(required = false) String cieNumber) {
        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        if (subject == null)
            return ResponseEntity.ok(List.of());
        List<Announcement> all = announcementRepository.findBySubjectIdIn(List.of(subjectId));
        if (cieNumber != null) {
            all = all.stream().filter(a -> cieNumber.equals(a.getCieNumber())).toList();
        }
        return ResponseEntity.ok(all);
    }

    // ========== HOD ENDPOINTS ==========

    @GetMapping("/hod/announcements")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<Announcement> getHodAnnouncements() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User hod = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (hod == null)
            return List.of();
        return announcementRepository.findBySubjectDepartment(hod.getDepartment());
    }

    @GetMapping("/hod/notifications")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<Notification> getHodNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User hod = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (hod == null)
            return List.of();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(hod.getId());
    }

    // ========== HOD/PRINCIPAL CREATE ANNOUNCEMENTS ==========

    @PostMapping("/announcements")
    // @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')") // Removed to allow
    // fallback auth
    public ResponseEntity<?> createAnnouncement(@RequestBody Map<String, Object> data) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Long subjectId = Long.valueOf(data.get("subjectId").toString()); // Extract from body

        System.out
                .println("CIE Announcement Request: User=" + username + ", SubjectId=" + subjectId + ", Data=" + data); // DEBUG

        // Fallback to senderId if Auth fails
        if ("anonymousUser".equals(username) || username == null) {
            if (data.containsKey("senderId")) {
                username = data.get("senderId").toString();
                System.out.println("Auth failed, using senderId from body: " + username);
            }
        }

        User creator = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        Subject subject = subjectRepository.findById(subjectId).orElse(null);

        if (creator == null || subject == null) {
            System.out
                    .println("CreateAnnouncement Failed: Creator=" + (creator == null ? "null" : creator.getUsername())
                            + ", Subject=" + (subject == null ? "null" : subject.getName())); // DEBUG
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid request"));
        }

        Announcement ann = new Announcement();
        ann.setSubject(subject);
        ann.setFaculty(creator);
        ann.setCieNumber(data.getOrDefault("cieNumber", "CIE-1").toString());
        ann.setScheduledDate(data.containsKey("scheduledDate") ? LocalDate.parse(data.get("scheduledDate").toString())
                : LocalDate.now().plusDays(7));
        ann.setStartTime(data.getOrDefault("startTime", "10:00 AM").toString());
        ann.setDurationMinutes(
                data.containsKey("durationMinutes") ? Integer.parseInt(data.get("durationMinutes").toString()) : 60);
        ann.setExamRoom(data.getOrDefault("examRoom", "TBD").toString());
        ann.setStatus("SCHEDULED");

        announcementRepository.save(ann);
        return ResponseEntity.ok(ann);
    }

    @PutMapping("/announcements/{id}")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Announcement ann = announcementRepository.findById(id).orElse(null);
        if (ann == null) {
            return ResponseEntity.notFound().build();
        }

        if (data.containsKey("scheduledDate")) {
            ann.setScheduledDate(LocalDate.parse(data.get("scheduledDate").toString()));
        }
        if (data.containsKey("startTime")) {
            ann.setStartTime(data.get("startTime").toString());
        }
        if (data.containsKey("durationMinutes")) {
            ann.setDurationMinutes(Integer.parseInt(data.get("durationMinutes").toString()));
        }
        if (data.containsKey("examRoom")) {
            ann.setExamRoom(data.get("examRoom").toString());
        }
        // Can also update subject/cieNumber if needed, but usually those are fixed for
        // a specific schedule event

        announcementRepository.save(ann);
        return ResponseEntity.ok(ann);
    }

    @DeleteMapping("/announcements/{id}")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        if (!announcementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        announcementRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
