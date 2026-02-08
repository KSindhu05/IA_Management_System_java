package com.ia.management.repository;

import com.ia.management.model.CIEMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CIEMarkRepository extends JpaRepository<CIEMark, Long> {
    List<CIEMark> findByStudentIdAndSubjectId(Long studentId, Long subjectId);

    Optional<CIEMark> findByStudentIdAndSubjectIdAndCieType(Long studentId, Long subjectId, CIEMark.CIEType cieType);

    List<CIEMark> findByStudentId(Long studentId);

    List<CIEMark> findBySubject_Department(String department);

    List<CIEMark> findBySubjectIdAndCieType(Long subjectId, CIEMark.CIEType cieType);

    List<CIEMark> findByStatusAndSubject_Department(CIEMark.MarkStatus status, String department);

    List<CIEMark> findByStudentIdAndStatus(Long studentId, CIEMark.MarkStatus status);

    List<CIEMark> findBySubjectId(Long subjectId);
}
