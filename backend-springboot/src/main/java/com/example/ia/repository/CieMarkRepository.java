package com.example.ia.repository;

import com.example.ia.entity.CieMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface CieMarkRepository extends JpaRepository<CieMark, Long> {
    List<CieMark> findByStudent_Id(Long studentId);

    List<CieMark> findBySubject_Id(Long subjectId);

    Optional<CieMark> findByStudent_IdAndSubject_IdAndCieType(Long studentId, Long subjectId, String cieType);

    List<CieMark> findByStatus(String status);

    // For HOD pending approvals
    List<CieMark> findByStatusAndSubject_Department(String status, String department);

    // Cleanup: delete zero-value marks that were erroneously submitted/approved
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM CieMark c WHERE (c.marks = 0.0 OR c.marks IS NULL) AND c.status IN ('SUBMITTED', 'APPROVED')")
    void deleteZeroValueSubmittedMarks();

    // Fix: convert 0-value PENDING marks to null (keeps record for unlock tracking)
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE CieMark c SET c.marks = NULL WHERE c.marks = 0.0 AND (c.status = 'PENDING' OR c.status IS NULL)")
    void nullifyZeroPendingMarks();
}
