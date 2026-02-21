package com.example.ia.repository;

import com.example.ia.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findByCode(String code);

    List<Subject> findByDepartment(String department);

    List<Subject> findBySemester(Integer semester);

    List<Subject> findByDepartmentAndSemester(String department, Integer semester);

    List<Subject> findByInstructorName(String instructorName);

    Optional<Subject> findByName(String name);

    List<Subject> findByNameIn(List<String> names);
}
