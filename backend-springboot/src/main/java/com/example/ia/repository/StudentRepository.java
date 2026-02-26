package com.example.ia.repository;

import com.example.ia.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRegNo(String regNo);

    List<Student> findByDepartment(String department);

    List<Student> findByDepartmentAndSemester(String department, Integer semester);

    @Query("SELECT DISTINCT s.section FROM Student s WHERE s.department = :department AND s.semester = :semester AND s.section IS NOT NULL AND s.section != ''")
    List<String> findDistinctSectionsByDepartmentAndSemester(@Param("department") String department,
            @Param("semester") Integer semester);

    List<Student> findBySectionIn(Collection<String> sections);

    List<Student> findByDepartmentIn(Collection<String> departments);

    List<Student> findByDepartmentInAndSectionIn(Collection<String> departments, Collection<String> sections);

    long countByDepartment(String department);
}
