package com.example.ia.repository;

import com.example.ia.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findBySubjectDepartment(String department);

    List<Announcement> findBySubjectIdIn(List<Long> subjectIds);

    List<Announcement> findByFaculty(com.example.ia.entity.User faculty);
}
