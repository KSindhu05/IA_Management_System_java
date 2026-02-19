package com.example.ia.service;

import com.example.ia.entity.Announcement;
import com.example.ia.entity.Notification;
import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.entity.User;
import com.example.ia.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CieService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Announcement> getStudentAnnouncements(String username) {
        Student student = studentRepository.findByRegNo(username).orElse(null);
        if (student == null)
            return List.of();

        List<Subject> subjects = subjectRepository.findByDepartmentAndSemester(student.getDepartment(),
                student.getSemester());
        List<Long> subjectIds = subjects.stream().map(Subject::getId).collect(Collectors.toList());

        if (subjectIds.isEmpty())
            return List.of();

        return announcementRepository.findBySubjectIdIn(subjectIds);
    }

    public List<Notification> getStudentNotifications(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null)
            return List.of();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public List<Announcement> getFacultySchedules(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null)
            return List.of();

        // 1. Find subjects assigned to this faculty (by name)
        List<Subject> subjects = subjectRepository.findByInstructorName(user.getFullName());

        // 2. Extract Subject IDs
        List<Long> subjectIds = subjects.stream().map(Subject::getId).collect(Collectors.toList());

        if (subjectIds.isEmpty()) {
            return List.of();
        }

        // 3. Find announcements for these subjects
        return announcementRepository.findBySubjectIdIn(subjectIds);
    }
}
