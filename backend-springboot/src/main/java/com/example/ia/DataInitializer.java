package com.example.ia;

import com.example.ia.entity.User;
import com.example.ia.entity.Student;
import com.example.ia.repository.UserRepository;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.CieMarkRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository,
            StudentRepository studentRepository,
            SubjectRepository subjectRepository,
            CieMarkRepository cieMarkRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            String defaultPassword = "password";

            // MANUAL JAVA CLEANUP to ensure it runs regardless of JPQL quirks
            java.util.List<com.example.ia.entity.CieMark> allMarks = cieMarkRepository.findAll();
            int fixedCount = 0;
            for (com.example.ia.entity.CieMark m : allMarks) {
                boolean isZero = m.getMarks() != null && Math.abs(m.getMarks()) < 0.001;
                if (!isZero)
                    continue;

                String status = m.getStatus();
                if (status == null || "PENDING".equals(status) || "REJECTED".equals(status)) {
                    // Zero placeholder or rejected zero — reset to null/PENDING so faculty can
                    // re-enter
                    m.setMarks(null);
                    m.setStatus("PENDING");
                    cieMarkRepository.save(m);
                    fixedCount++;
                } else if ("SUBMITTED".equals(status) || "APPROVED".equals(status)) {
                    // Erroneously submitted/approved zero — delete
                    cieMarkRepository.delete(m);
                    fixedCount++;
                }
            }
            System.out.println("✅ JAVA CLEANUP: Fixed/Deleted " + fixedCount + " zero-value marks.");

            // CLEANUP: Remove Advanced Java if it exists
            subjectRepository.findFirstByName("Advanced Java").ifPresent(subject -> {
                java.util.List<com.example.ia.entity.CieMark> marks = cieMarkRepository
                        .findBySubject_Id(subject.getId());
                cieMarkRepository.deleteAll(marks);
                subjectRepository.delete(subject);
                System.out.println("✅ Cleaned up 'Advanced Java' subject and marks.");
            });

            // CLEANUP: Remove marks for Indian Constitution if they exist (KEEP the
            // subject)
            subjectRepository.findFirstByName("Indian Constitution").ifPresent(subject -> {
                java.util.List<com.example.ia.entity.CieMark> marks = cieMarkRepository
                        .findBySubject_Id(subject.getId());
                if (!marks.isEmpty()) {
                    cieMarkRepository.deleteAll(marks);
                    System.out
                            .println("🗑️ Deleted " + marks.size() + " marks for Indian Constitution (kept subject).");
                }
            });

            // CLEANUP: Remove Marks for 459CS25001 for DBMS and Software Engineering
            // This is to remove them from Student Dashboard but keep data for Faculty (via
            // 459CS25002)
            List.of("DBMS", "Software Engineering").forEach(subName -> {
                subjectRepository.findFirstByName(subName).ifPresent(subject -> {
                    studentRepository.findByRegNo("459CS25001").ifPresent(student -> {
                        // Actually better to find all marks for this student and subject
                        // We seeded CIE1 and CIE2 for DBMS, and CIE1 for SE.
                        // Let's rely on the specific deletion logic or loop.
                        // Or just use the repo's delete method if we fetch them.

                        // Let's just delete CIE1/CIE2 for DBMS and CIE1 for SE if they exist.
                        cieMarkRepository
                                .findByStudent_IdAndSubject_IdAndCieType(student.getId(), subject.getId(), "CIE1")
                                .ifPresent(cieMarkRepository::delete);
                        cieMarkRepository
                                .findByStudent_IdAndSubject_IdAndCieType(student.getId(), subject.getId(), "CIE2")
                                .ifPresent(cieMarkRepository::delete);
                        System.out.println("✅ Cleaned up " + subName + " marks for 459CS25001.");
                    });
                });
            });

            // 1. Principal
            if (!userRepository.existsByUsername("PRINCIPAL")) {
                User principal = new User();
                principal.setUsername("PRINCIPAL");
                principal.setPassword(passwordEncoder.encode(defaultPassword));
                principal.setEmail("principal@example.com");
                principal.setRole("PRINCIPAL");
                principal.setFullName("Principal Admin");
                principal.setDesignation("Principal");
                principal.setDepartment("ADMIN");
                userRepository.save(principal);
                System.out.println("✅ Principal user created: PRINCIPAL / " + defaultPassword);
            }

            // 2. HOD — cleanup old username if it exists
            userRepository.findByUsername("HOD001").ifPresent(oldHod -> {
                userRepository.delete(oldHod);
                System.out.println("🗑️ Deleted old HOD user: HOD001");
            });
            boolean hodIsNew = !userRepository.existsByUsername("Jaffar@CSE");
            User hodUser = userRepository.findByUsername("Jaffar@CSE").orElse(new User());
            hodUser.setUsername("Jaffar@CSE");
            if (hodIsNew) {
                hodUser.setPassword(passwordEncoder.encode(defaultPassword));
            }
            hodUser.setEmail("hod.cs@example.com");
            hodUser.setRole("HOD");
            hodUser.setFullName("MD Jaffar");
            hodUser.setDesignation("Head of Department");
            hodUser.setDepartment("CSE");
            userRepository.save(hodUser);
            System.out.println("✅ HOD user " + (hodIsNew ? "created" : "updated (password preserved)")
                    + ": Jaffar@CSE (MD Jaffar)");

            // HOD - EEE Department
            boolean hodEeeIsNew = !userRepository.existsByUsername("HOD@EEE");
            User hodEeeUser = userRepository.findByUsername("HOD@EEE").orElse(new User());
            hodEeeUser.setUsername("HOD@EEE");
            if (hodEeeIsNew) {
                hodEeeUser.setPassword(passwordEncoder.encode(defaultPassword));
            }
            hodEeeUser.setEmail("hod.eee@example.com");
            hodEeeUser.setRole("HOD");
            hodEeeUser.setFullName("HOD EEE");
            hodEeeUser.setDesignation("Head of Department");
            hodEeeUser.setDepartment("EEE");
            userRepository.save(hodEeeUser);
            System.out.println("✅ HOD EEE user " + (hodEeeIsNew ? "created" : "updated (password preserved)")
                    + ": HOD@EEE");

            // 3. Faculty Seeding
            // FAC001 - Miss Manju Sree
            boolean fac1IsNew = !userRepository.existsByUsername("FAC001");
            User fac1 = userRepository.findByUsername("FAC001").orElse(new User());
            fac1.setUsername("FAC001");
            if (fac1IsNew) {
                fac1.setPassword(passwordEncoder.encode(defaultPassword));
            }
            fac1.setEmail("manjusree@example.com");
            fac1.setFullName("Miss Manju Sree");
            fac1.setDesignation("Assistant Professor");
            fac1.setDepartment("CSE");
            fac1.setRole("FACULTY");
            fac1.setSubjects("Engineering Maths-II");
            userRepository.save(fac1);
            System.out.println("✅ Faculty FAC001 " + (fac1IsNew ? "created" : "updated (password preserved)")
                    + ": Miss Manju Sree");

            // FAC002 - Ramesh Gouda
            boolean fac2IsNew = !userRepository.existsByUsername("FAC002");
            User fac2 = userRepository.findByUsername("FAC002").orElse(new User());
            fac2.setUsername("FAC002");
            if (fac2IsNew) {
                fac2.setPassword(passwordEncoder.encode(defaultPassword));
            }
            fac2.setEmail("rameshgouda@example.com");
            fac2.setFullName("Ramesh Gouda");
            fac2.setDesignation("Assistant Professor");
            fac2.setDepartment("CSE");
            fac2.setRole("FACULTY");
            fac2.setSubjects("CAEG");
            userRepository.save(fac2);
            System.out.println(
                    "✅ Faculty FAC002 " + (fac2IsNew ? "created" : "updated (password preserved)") + ": Ramesh Gouda");

            // FAC003 - Wahida Banu
            boolean fac3IsNew = !userRepository.existsByUsername("FAC003");
            User fac3 = userRepository.findByUsername("FAC003").orElse(new User());
            fac3.setUsername("FAC003");
            if (fac3IsNew) {
                fac3.setPassword(passwordEncoder.encode(defaultPassword));
            }
            fac3.setEmail("wahidabanu@example.com");
            fac3.setFullName("Wahida Banu");
            fac3.setDesignation("Assistant Professor");
            fac3.setDepartment("CSE");
            fac3.setRole("FACULTY");
            fac3.setSubjects("Python,Indian Constitution");
            userRepository.save(fac3);
            System.out.println(
                    "✅ Faculty FAC003 " + (fac3IsNew ? "created" : "updated (password preserved)") + ": Wahida Banu");

            // FAC004 - Nasrin Banu
            boolean fac4IsNew = !userRepository.existsByUsername("FAC004");
            User fac4 = userRepository.findByUsername("FAC004").orElse(new User());
            fac4.setUsername("FAC004");
            if (fac4IsNew) {
                fac4.setPassword(passwordEncoder.encode(defaultPassword));
            }
            fac4.setEmail("nasrinbanu@example.com");
            fac4.setFullName("Nasrin Banu");
            fac4.setDesignation("Assistant Professor");
            fac4.setDepartment("CSE");
            fac4.setRole("FACULTY");
            fac4.setSubjects("English Communication");
            userRepository.save(fac4);
            System.out.println(
                    "✅ Faculty FAC004 " + (fac4IsNew ? "created" : "updated (password preserved)") + ": Nasrin Banu");

            // 4. Real Student Seeding (459CS25001 - A KAVITHA)
            if (!userRepository.existsByUsername("459CS25001")) {
                User studentUser = new User();
                studentUser.setUsername("459CS25001");
                studentUser.setPassword(passwordEncoder.encode(defaultPassword));
                studentUser.setEmail("459CS25001@student.college.edu");
                studentUser.setRole("STUDENT");
                studentUser.setFullName("A KAVITHA");
                studentUser.setDepartment("CSE");
                studentUser.setSemester("2"); // From CSV: Sem 2
                studentUser.setSection("A");
                userRepository.save(studentUser);

                Student studentEntity = new Student();
                studentEntity.setRegNo("459CS25001");
                studentEntity.setName("A KAVITHA");
                studentEntity.setDepartment("CSE");
                studentEntity.setSemester(2);
                studentEntity.setSection("A");
                studentEntity.setEmail("459CS25001@student.college.edu");
                studentEntity.setPhone("9071407865"); // From CSV
                studentRepository.save(studentEntity);

                System.out.println("✅ Student user created: 459CS25001 / " + defaultPassword);
            }

            // 5. Real Student Seeding (459CS25002 - ABHISHEKA)
            // ... (Existing code for 002) ...

            // SEED REMAINING STUDENTS (Total 63)
            // Robust logic: Ensure User AND Student exist regardless of each other
            for (int i = 1; i <= 63; i++) {
                String regNo = String.format("459CS25%03d", i);

                // 1. Ensure User
                if (!userRepository.existsByUsername(regNo)) {
                    User studentUser = new User();
                    studentUser.setUsername(regNo);
                    studentUser.setPassword(passwordEncoder.encode(defaultPassword));
                    studentUser.setEmail(regNo + "@student.college.edu");
                    studentUser.setRole("STUDENT");
                    studentUser.setFullName("Student " + i);
                    studentUser.setDepartment("CSE");
                    studentUser.setSemester("2");
                    studentUser.setSection("A");
                    userRepository.save(studentUser);
                    System.out.println("✅ Created User: " + regNo);
                }

                // 2. Ensure Student Entity
                if (studentRepository.findByRegNo(regNo).isEmpty()) {
                    Student studentEntity = new Student();
                    studentEntity.setRegNo(regNo);
                    studentEntity.setName("Student " + i);
                    studentEntity.setDepartment("CSE");
                    studentEntity.setSemester(2);
                    studentEntity.setSection("A");
                    studentEntity.setEmail(regNo + "@student.college.edu");
                    studentEntity.setPhone("9999999999");
                    studentRepository.save(studentEntity);
                    System.out.println("✅ Created Student Entity: " + regNo);
                }
            }

            long studentCount = studentRepository.count();
            System.out.println("📊 Total Students in DB: " + studentCount);

            // FIX: Update existing students' department from CS to CSE
            List<Student> allStudents = studentRepository.findAll();
            for (Student s : allStudents) {
                if ("CS".equals(s.getDepartment())) {
                    s.setDepartment("CSE");
                    studentRepository.save(s);
                }
            }
            System.out.println("✅ Updated all students' department to CSE");

            // ==========================================
            // CLEANUP: Remove unwanted test subjects (DBMS, Operating Systems, Software
            // Engineering)
            // ==========================================
            List<String> unwantedSubjects = List.of("DBMS", "Operating Systems", "Software Engineering");
            for (String subName : unwantedSubjects) {
                subjectRepository.findFirstByName(subName).ifPresent(subject -> {
                    // Delete all CIE marks linked to this subject first
                    List<com.example.ia.entity.CieMark> marks = cieMarkRepository.findBySubject_Id(subject.getId());
                    if (!marks.isEmpty()) {
                        cieMarkRepository.deleteAll(marks);
                        System.out.println("🗑️ Deleted " + marks.size() + " marks for subject: " + subName);
                    }
                    subjectRepository.delete(subject);
                    System.out.println("🗑️ Deleted subject: " + subName);
                });
            }

            // Only keep real subjects
            createSubjectIfNotFound(subjectRepository, "Engineering Maths-II", "CSE", "Miss Manju Sree", 2);
            createSubjectIfNotFound(subjectRepository, "CAEG", "CSE", "Ramesh Gouda", 2);
            createSubjectIfNotFound(subjectRepository, "Python", "CSE", "Wahida Banu", 2);
            createSubjectIfNotFound(subjectRepository, "Indian Constitution", "CSE", "Wahida Banu", 2);
            createSubjectIfNotFound(subjectRepository, "English Communication", "CSE", "Nasrin Banu", 2);

            // ==========================================
            // SEED MARKS: Add sample CIE marks for students
            // ==========================================
            String[] subjects = { "Engineering Maths-II", "CAEG", "Python",
                    "English Communication" };
            double[][] sampleScores = {
                    { 42, 38, 45, 35 }, // Student 1
                    { 35, 40, 30, 42 }, // Student 2
                    { 28, 32, 35, 25 }, // Student 3
                    { 45, 42, 48, 40 }, // Student 4
                    { 30, 25, 28, 30 }, // Student 5
                    { 38, 35, 40, 33 }, // Student 6
                    { 20, 22, 18, 20 }, // Student 7
                    { 40, 38, 42, 36 }, // Student 8
                    { 33, 30, 35, 28 }, // Student 9
                    { 45, 48, 46, 42 }, // Student 10
            };

            // ==========================================
            // FIX: Update PENDING marks to SUBMITTED — only if they have actual marks
            // Delete PENDING records with null marks (empty placeholders)
            // ==========================================
            List<com.example.ia.entity.CieMark> pendingMarks = cieMarkRepository.findAll()
                    .stream()
                    .filter(m -> "PENDING".equalsIgnoreCase(m.getStatus()))
                    .collect(java.util.stream.Collectors.toList());
            if (!pendingMarks.isEmpty()) {
                List<com.example.ia.entity.CieMark> withMarks = pendingMarks.stream()
                        .filter(m -> m.getMarks() != null)
                        .collect(java.util.stream.Collectors.toList());
                List<com.example.ia.entity.CieMark> withoutMarks = pendingMarks.stream()
                        .filter(m -> m.getMarks() == null)
                        .collect(java.util.stream.Collectors.toList());
                withMarks.forEach(m -> m.setStatus("SUBMITTED"));
                cieMarkRepository.saveAll(withMarks);
                if (!withoutMarks.isEmpty()) {
                    cieMarkRepository.deleteAll(withoutMarks);
                    System.out.println("🗑️ Deleted " + withoutMarks.size() + " empty placeholder marks");
                }
                System.out.println("✅ Updated " + withMarks.size() + " PENDING marks with data to SUBMITTED");
            }

            for (int i = 0; i < 10; i++) {
                String regNo = String.format("459CS25%03d", i + 1);
                for (int j = 0; j < subjects.length; j++) {
                    seedMarks(studentRepository, userRepository, subjectRepository, cieMarkRepository,
                            regNo, subjects[j], "CIE1", sampleScores[i][j]);
                }
            }
            System.out.println("✅ Sample CIE marks seeded for 10 students");

        };
    }

    private void createSubjectIfNotFound(com.example.ia.repository.SubjectRepository repo,
            String name, String dept, String instructor, int sem) {
        String code = "SUB" + name.substring(0, 3).toUpperCase();
        com.example.ia.entity.Subject s = repo.findByCodeAndDepartment(code, dept)
                .orElseGet(() -> repo.findFirstByName(name).orElse(new com.example.ia.entity.Subject()));
        s.setName(name);
        s.setDepartment(dept);
        s.setInstructorName(instructor);
        s.setSemester(sem);
        s.setCode(code);
        if (s.getCredits() == null || s.getCredits() == 0) {
            s.setCredits(4);
        }
        repo.save(s);
        System.out.println("✅ Subject updated: " + name + " (dept=" + dept + ", instructor=" + instructor + ")");
    }

    private void seedMarks(com.example.ia.repository.StudentRepository studentRepo,
            com.example.ia.repository.UserRepository userRepo,
            com.example.ia.repository.SubjectRepository subjectRepo,
            com.example.ia.repository.CieMarkRepository marksRepo,
            String regNo, String subjectName, String cieType, Double score) {

        com.example.ia.entity.Student student = studentRepo.findByRegNo(regNo).orElse(null);
        com.example.ia.entity.Subject subject = subjectRepo.findFirstByName(subjectName).orElse(null);

        if (student != null && subject != null) {
            java.util.Optional<com.example.ia.entity.CieMark> existing = marksRepo
                    .findByStudent_IdAndSubject_IdAndCieType(student.getId(), subject.getId(), cieType);
            if (existing.isEmpty()) {
                // Create new mark
                com.example.ia.entity.CieMark mark = new com.example.ia.entity.CieMark();
                mark.setStudent(student);
                mark.setSubject(subject);
                mark.setCieType(cieType);
                mark.setMarks(score);
                mark.setStatus("SUBMITTED");
                marksRepo.save(mark);
                System.out.println("✅ Mark seeded: " + regNo + " " + subjectName + " " + cieType);
            } else {
                // Update existing mark: ensure it's SUBMITTED and has correct score
                com.example.ia.entity.CieMark mark = existing.get();
                if ("PENDING".equalsIgnoreCase(mark.getStatus()) || mark.getMarks() == null) {
                    mark.setMarks(score);
                    mark.setStatus("SUBMITTED");
                    marksRepo.save(mark);
                    System.out.println("✅ Mark updated to SUBMITTED: " + regNo + " " + subjectName + " " + cieType);
                }
            }
        }
    }
}
