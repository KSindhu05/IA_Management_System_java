package com.example.ia.repository;

import com.example.ia.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    List<User> findByRole(String role);

    List<User> findByDepartment(String department);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    Optional<User> findByFullName(String fullName);

    List<User> findByRoleAndDepartment(String role, String department);

    long countByRoleAndDepartment(String role, String department);
}
