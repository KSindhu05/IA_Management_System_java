package com.example.ia.repository;

import com.example.ia.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRegNo(String regNo);

    List<Student> findByDepartment(String department);

    List<Student> findByDepartmentAndSemester(String department, Integer semester);

    long countByDepartment(String department);
}
