package com.example.ia.repository;

import com.example.ia.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findBySubjectId(Long subjectId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByFaculty(com.example.ia.entity.User faculty);
}
