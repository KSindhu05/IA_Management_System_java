package com.example.ia.repository;

import com.example.ia.entity.CieMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CieMarkRepository extends JpaRepository<CieMark, Long> {
    List<CieMark> findByStudentId(Long studentId);

    List<CieMark> findBySubjectId(Long subjectId);

    Optional<CieMark> findByStudentIdAndSubjectIdAndCieType(Long studentId, Long subjectId, String cieType);

    List<CieMark> findByStatus(String status);

    // For HOD pending approvals
    List<CieMark> findByStatusAndSubjectDepartment(String status, String department);
}
