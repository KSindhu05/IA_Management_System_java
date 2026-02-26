# IA Management System — Detailed Explanation

## Table of Contents
1. [What is This Project?](#1-what-is-this-project)
2. [Technologies Used & Why](#2-technologies-used--why)
3. [Backend — Spring Boot (Detailed)](#3-backend--spring-boot-detailed)
4. [Frontend — React (Detailed)](#4-frontend--react-detailed)
5. [How The Full Application Works Together](#5-how-the-full-application-works-together)

---

## 1. What is This Project?

The **IA (Internal Assessment) Management System** is a web application that digitizes and streamlines the **Continuous Internal Evaluation (CIE)** process in a college. Instead of managing exam marks on paper or spreadsheets, this system provides:

- **Faculty** enter CIE marks for students and submit them for approval
- **HOD** reviews, approves, or rejects the submitted marks
- **Students** view their approved marks and attendance
- **Principal** monitors institution-wide academic performance

### Why Was This Built?
In most Indian engineering colleges, CIE marks are managed manually — faculty fills in Excel sheets, prints them, gets HOD signatures, and files them. This is error-prone and slow. This system replaces the entire process digitally with role-based access control, approval workflows, and real-time analytics dashboards.

---

## 2. Technologies Used & Why

### Backend: Spring Boot (Java)
| Technology | Why We Use It |
|-----------|--------------|
| **Spring Boot** | It is a Java framework that auto-configures a production-ready web server. We chose it because it integrates seamlessly with MySQL, handles security (JWT), and follows the MVC pattern which keeps code organized. |
| **Spring Security** | Handles authentication (login) and authorization (who can access what). Without this, anyone could access any API. It provides `@PreAuthorize` annotations to restrict endpoints to specific roles. |
| **Spring Data JPA** | Lets us interact with the MySQL database using Java objects instead of writing raw SQL queries. We just define entity classes and repository interfaces — Spring auto-generates the SQL at runtime. |
| **JWT (JSON Web Token)** | Used for stateless authentication. After login, the server issues a token. The frontend stores this token and sends it with every request. The backend validates the token without needing to maintain server-side sessions — this is more scalable. |
| **BCrypt** | A password hashing algorithm. We never store plain-text passwords. BCrypt adds a random salt to each password before hashing, so even if two users have the same password, their hashes are different. |
| **MySQL** | A relational database. We chose it because the data (students, subjects, marks) is highly relational — a student has marks in multiple subjects, each mark belongs to a CIE type, etc. Relational databases handle this naturally with foreign keys. |
| **Maven** | Build tool that manages Java dependencies (like npm for Java). The `pom.xml` lists all libraries we need, and Maven downloads them automatically. |

### Frontend: React
| Technology | Why We Use It |
|-----------|--------------|
| **React** | A JavaScript library for building user interfaces with reusable components. Each dashboard (Student, Faculty, HOD, Principal) is a component. React's virtual DOM makes UI updates fast. |
| **React Router** | Enables single-page application (SPA) navigation — `/dashboard/student`, `/dashboard/faculty`, etc. The page doesn't reload when navigating between routes, which feels faster. |
| **Context API** | React's built-in state management. We use it for `AuthContext` (stores logged-in user info across all components) and `ThemeContext` (dark/light mode). It avoids "prop drilling" — passing data through 5+ layers of components. |
| **CSS Modules** | Each page has its own `.module.css` file. CSS Modules scope class names to a single component, so a `.container` in `Login.module.css` won't conflict with `.container` in `FacultyDashboard.module.css`. |
| **Fetch API** | The browser's built-in HTTP client. We use it to call our Spring Boot backend APIs. Every data operation (loading marks, saving marks, login) goes through fetch. |
| **localStorage** | The browser's key-value storage. We store the user's JWT token and profile here so the user stays logged in even after refreshing the page. |

---

## 3. Backend — Spring Boot (Detailed)

### 3.1 Application Entry Point

**File:** `IaManagementApplication.java`

```java
@SpringBootApplication
public class IaManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(IaManagementApplication.class, args);
    }
}
```

**Why:** This is the main class. `@SpringBootApplication` tells Spring to auto-scan for components, auto-configure the database, web server, and security. `SpringApplication.run()` starts the embedded Tomcat server on port 8084.

---

### 3.2 Configuration (`application.properties`)

```properties
server.port=8084
spring.datasource.url=jdbc:mysql://localhost:3306/ia_management_nodejs
spring.jpa.hibernate.ddl-auto=update
app.jwtSecret=SecretKey...
app.jwtExpirationMs=36000000
```

| Property | Why |
|----------|-----|
| `server.port=8084` | The backend runs on port 8084 (frontend runs on 3000). We avoid port conflicts. |
| `spring.datasource.url` | Tells Spring how to connect to our MySQL database. |
| `spring.jpa.hibernate.ddl-auto=update` | Hibernate automatically creates new tables when we add an entity class, and alters existing tables when we add new fields. We don't need to write manual SQL migration scripts during development. |
| `app.jwtSecret` | The secret key used to sign JWT tokens. It must be long enough (minimum 256 bits for HMAC-SHA). If someone knows this key, they can forge tokens, so it must be kept secret. |
| `app.jwtExpirationMs=36000000` | JWT tokens expire after 10 hours. This balances security (expired tokens can't be misused) with convenience (faculty doesn't need to re-login every 30 minutes). |

---

### 3.3 Entity Classes — The Database Tables

Entities are Java classes annotated with `@Entity`. Each class becomes a MySQL table. Each field becomes a column.

#### Why We Need Each Entity

**`User.java`** — Why?
Every person who logs into the system needs an account. Faculty, HOD, Principal, and Students all log in. The `role` field determines what dashboard they see and what APIs they can access. The `subjects` field (comma-separated) tracks which subjects a faculty teaches. The `section` field tracks which student sections a faculty handles.

**`Student.java`** — Why?
Students need a separate table from Users because students have additional academic data — `regNo`, `semester`, `section`, `parentPhone`. The `regNo` (registration number) is both the student's unique identifier AND their login username. This simplifies the system — students don't need to create separate usernames.

**`Subject.java`** — Why?
Subjects (like "Data Structures", "DBMS") are the core organizational unit. Marks are entered per subject, exams are scheduled per subject, faculty are assigned to subjects. The `getMaxMarks()` method always returns 50 because in this college's CIE scheme, each CIE is scored out of 50.

**`CieMark.java`** — Why?
This is the most important table. Each record stores ONE student's mark for ONE CIE exam in ONE subject. For example: "Student A scored 45 in CIE-1 of Data Structures". The `status` field (`PENDING` → `SUBMITTED` → `APPROVED`/`REJECTED`) drives the entire marks approval workflow. The `attendancePercentage` field stores the student's attendance alongside their marks.

**Why separate records per CIE type instead of one record with 5 columns?** Because not all CIEs may be conducted at the same time. CIE-1 might have marks while CIE-2 hasn't happened yet. Having separate records allows us to track the approval status of each CIE independently.

**`Attendance.java`** — Why?
Tracks daily attendance records — each row says "Student X was PRESENT/ABSENT in Subject Y on Date Z, marked by Faculty F". This provides a detailed audit trail beyond just the percentage.

**`Announcement.java`** — Why?
CIE exam schedules need to be communicated to students. An announcement stores the exam date, time, room, and CIE number. The `syllabusCoverage` field lets faculty document which topics are covered in each CIE — students can see this to prepare.

**`FacultyAssignmentRequest.java`** — Why?
In some colleges, a faculty from the Computer Science department might teach a subject in the Electronics department. This entity handles that workflow — faculty submits a request, the target department's HOD approves or rejects it. The `status` field tracks the request lifecycle.

**`Notification.java`** — Why?
In-app notifications keep users informed — "Your CIE-1 marks have been approved", "New exam scheduled for next week". The `isRead` flag lets us highlight unread notifications.

---

### 3.4 Repository Interfaces — How We Access the Database

Repositories extend `JpaRepository<Entity, IDType>`. Spring Data JPA auto-implements all methods at runtime. We just define the method name, and Spring generates the SQL.

#### How Spring Data JPA Method Naming Works

```java
// This method name tells Spring: "SELECT * FROM students WHERE regNo = ?"
Optional<Student> findByRegNo(String regNo);

// This means: "SELECT * FROM users WHERE role = ? AND department = ?"
List<User> findByRoleAndDepartment(String role, String department);

// This means: "SELECT * FROM cie_marks WHERE student_id = ? AND subject_id = ? AND cie_type = ?"
Optional<CieMark> findByStudent_IdAndSubject_IdAndCieType(Long studentId, Long subjectId, String cieType);

// This means: "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC"
List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

// Count query: "SELECT COUNT(*) FROM users WHERE role = ? AND department = ?"
long countByRoleAndDepartment(String role, String department);
```

**Why this approach?** We never write raw SQL. The method names ARE the query definitions. This reduces bugs (no typos in SQL strings), is type-safe (compiler catches errors), and is much faster to develop.

#### Key Repository Methods & Why

| Repository | Method | Why We Need It |
|---|---|---|
| `UserRepository` | `findByUsername()` | Login — we look up the user by their entered username |
| `UserRepository` | `findByRoleAndDepartment()` | HOD needs to list faculty in their department; broadcasting notifications to department faculty |
| `StudentRepository` | `findByRegNo()` | Student profile lookup — regNo is used as username |
| `StudentRepository` | `findBySectionIn()` | Faculty filtered view — show only students in their assigned sections |
| `CieMarkRepository` | `findBySubject_Id()` | Load all marks for a subject — used when faculty enters marks or HOD reviews |
| `CieMarkRepository` | `findByStudent_IdAndSubject_IdAndCieType()` | Check if a mark already exists before creating — prevents duplicate records |
| `CieMarkRepository` | `findByStatusAndSubject_Department()` | HOD pending approvals — find all SUBMITTED marks in their department |
| `SubjectRepository` | `findByDepartmentAndSemester()` | Find subjects a student should see (based on their dept + semester) |
| `SubjectRepository` | `findByNameIn()` | Find Subject entities from a list of names — used to resolve faculty's comma-separated subject list |

---

### 3.5 Service Classes — Business Logic (The "Why" Behind Each Method)

#### `AuthService` — Handles Login & Registration

**`authenticateUser(LoginRequest)` — Why?**
When a user clicks "Login", the frontend sends username and password. This method:
1. Uses Spring's `AuthenticationManager` to verify credentials against the database (password is compared using BCrypt)
2. If valid, generates a JWT token using `JwtUtils`
3. Returns a `JwtResponse` containing the token, user ID, role, department, and fullName
4. The role is stripped of the `ROLE_` prefix (Spring adds it internally, but frontend expects `FACULTY` not `ROLE_FACULTY`)

**Why JWT instead of sessions?** Sessions require server-side storage. If you restart the server, all users are logged out. JWT tokens are self-contained — the token itself contains the user info and is cryptographically signed. The server doesn't need to "remember" anything.

**`registerUser(SignupRequest)` — Why?**
Creates a new user account. The password is BCrypt-encoded before saving. This is typically called by an admin script or the data seeder, not by regular users.

---

#### `MarksService` — The Core Business Logic

**`updateBatchMarks(List<CieMark>)` — Why?**
Faculty enters marks for an entire class at once (30+ students). Instead of saving each student's marks individually (30 HTTP requests), we send them all in one batch. This method:
1. Loops through each mark in the payload
2. For each, checks if a record already exists (`findByStudent_IdAndSubject_IdAndCieType`)
3. If exists → updates the marks value and attendance percentage
4. If not exists → creates a new record (only if marks are not null — we don't create empty placeholders)
5. Uses `@Transactional` — if any save fails, ALL changes are rolled back (data consistency)

**Why the "upsert" pattern?** Because faculty may save marks multiple times — first draft, corrections, re-saves after rejection. We can't always create new records; we need to update existing ones.

**`submitMarks(subjectId, cieType, faculty)` — Why?**
After faculty enters all marks, they click "Submit". This changes the status from `PENDING` → `SUBMITTED`. Only marks that have actual values (`marks != null`) are submitted — empty cells are not submitted. This is the trigger that makes marks visible to the HOD for review.

**`getPendingApprovals(department)` — Why?**
The HOD needs to see which marks have been submitted for review. This finds all `SUBMITTED` marks in the HOD's department. The HOD then decides to approve or reject.

**`approveMarks(subjectId, cieType)` — Why?**
When HOD clicks "Approve", this changes status from `SUBMITTED` → `APPROVED`. Only APPROVED marks are visible to students. This ensures students never see unverified marks.

**`rejectMarks(subjectId, cieType)` — Why?**
If HOD finds errors, they reject the marks. Status changes to `REJECTED`. This reopens the marks for faculty editing — the faculty can correct and re-submit.

**`unlockMarks(subjectId, cieType)` — Why?**
Sometimes after approval, the HOD realizes marks need correction. This resets APPROVED marks back to `PENDING`. It also creates PENDING placeholder records for students who don't have marks for that CIE type yet — this ensures the frontend shows editable rows for all students.

**`getMarksByStudentUsername(username)` — Why?**
Students view their own marks. This finds marks by the student's regNo (which is their username). Critically, it **filters out PENDING marks** — students should only see marks that have been at least submitted, never incomplete draft marks.

---

#### `FacultyService` — Faculty-Specific Logic

**`getSubjectsForFaculty(username)` — Why?**
A faculty can teach subjects in their own department (stored in `user.subjects` field, comma-separated) AND subjects in other departments (from approved `FacultyAssignmentRequest` records). This method combines both sources:
1. Parse the faculty's `subjects` field (e.g., `"Data Structures,DBMS"` → `["Data Structures", "DBMS"]`)
2. Find all APPROVED cross-department assignments for this faculty
3. Extract subject names from those requests
4. Combine all subject names into a single set
5. Query the `Subject` table to get full entities

**Why combine both?** Because the cross-department assignment feature was added later. We need backward compatibility — faculty who were assigned subjects the old way (directly in the `subjects` field) must still work.

**`getStudentsForFaculty(username)` — Why?**
A faculty should only see students they teach. If faculty teaches sections A and B, they shouldn't see section C students. This method:
1. Parses the faculty's `section` field (e.g., `"A,B"` → `["A", "B"]`)
2. Also checks approved cross-department assignments for additional sections
3. Queries students by those sections
4. If no sections are set → returns all students (graceful fallback)

**Why the fallback?** During initial setup, faculty might not have sections assigned yet. Showing zero students would be confusing. Showing all students is a safer default.

**`getAnalytics(username)` — Why?**
Faculty need a performance overview — "how is my class doing?" This calculates:
- Total students evaluated
- Average score percentage (normalized to 0-100% from 0-50 marks)
- Count of low performers (marks < 20, which is below 40% of 50)
- Count of top performers (marks ≥ 40, which is 80%+)
- List of bottom 5 performers with names and subjects

**Why < 20 for "at risk"?** Because each CIE is out of 50. A score below 20 means below 40%, which is typically the failing threshold.

---

#### `StudentService` — Student Data

**`getFacultyForStudent(username)` — Why?**
Students need to know who teaches them. This method:
1. Finds the student by regNo
2. Gets all subjects for their department + semester
3. Gets all faculty in their department
4. For each faculty, checks if they teach any of those subjects AND are assigned to the student's section
5. Returns matching faculty with their names, subjects, and email

**Why the section check?** In large departments, multiple faculty may teach the same subject to different sections. Section A's student should only see section A's faculty.

**`getStudentsWithAnalytics(department)` — Why?**
The HOD's student list needs marks alongside student data. This wraps each student with a map of their CIE marks (e.g., `{cie1: 45, cie2: 38}`). This avoids multiple API calls — the HOD gets everything in one request.

---

#### `CieService` — CIE Schedule Management

**`getStudentAnnouncements(username)` — Why?**
Students should only see exam announcements for their subjects. This:
1. Finds the student's department and semester
2. Gets subjects for that department+semester
3. Returns announcements only for those subjects

**Why not show all announcements?** A 3rd semester CS student doesn't need to see 5th semester Electronics exam schedules.

**`getFacultySchedules(username)` — Why?**
Faculty see exam schedules for subjects they teach. This finds subjects where the faculty is the instructor (by `instructorName`) and returns their announcements.

---

### 3.6 Controllers — API Endpoints (Detailed)

Controllers receive HTTP requests, call services, and return responses.

#### `AuthController` (`/api/auth`)

**`POST /login` — Why?**
The login endpoint. Takes `{username, password}`, returns `{token, role, department, ...}`. The try-catch ensures invalid credentials return a 401 error with a user-friendly message instead of a 500 server error.

**`POST /signup` — Why?**
User registration. Used by admin scripts or the data seeder to create initial accounts.

---

#### `MarksController` (`/api/marks`)

**`GET /subject/{subjectId}` — Why?**
Faculty needs all marks for a subject to display in the marks entry table. The `@PreAuthorize` ensures only Faculty/HOD/Principal can access this — students cannot see raw marks data.

**`GET /my-marks` — Why?**
Student-facing endpoint. Uses `SecurityContextHolder` to get the logged-in user's username (automatically extracted from the JWT token), then fetches their marks. Students only see SUBMITTED/APPROVED marks, never PENDING drafts.

**`POST /update/batch` — Why?**
Faculty enters marks for a class and clicks "Save". The frontend collects all marks into an array and sends them in one request. The controller maps each DTO to a `CieMark` entity (resolving student and subject IDs from the database) before calling the service.

**Why DTO → Entity mapping in the controller?** Because the frontend sends simple IDs (`studentId`, `subjectId`), but the entity needs full `Student` and `Subject` objects. The controller resolves these using the repositories.

**`POST /submit`, `/approve`, `/reject`, `/unlock` — Why?**
These four endpoints implement the marks approval state machine:
```
PENDING → (submit) → SUBMITTED → (approve) → APPROVED
                                → (reject) → REJECTED → (re-edit) → PENDING
APPROVED → (unlock) → PENDING
```

---

#### `HodController` (`/api/hod`)

This is the largest controller (829 lines) because the HOD has the most responsibilities.

**`GET /overview?department=` — Why?**
The HOD dashboard needs a comprehensive view: faculty count, student count, subject count, CIE completion percentages, marks summary, and recent announcements — all in one API call. This avoids making 10 separate requests on page load.

**`POST /faculty` — Why?**
HOD creates new faculty accounts. This creates a `User` with role `FACULTY`, assigns subjects, and BCrypt-encodes the password.

**`DELETE /faculty/{id}` — Why?**
When deleting a faculty, we can't just delete the user record — there might be attendance records, CIE marks, and announcements linked to this faculty. This endpoint cascades: deletes attendance by faculty, clears `instructorName` from subjects, and removes assignment requests before deleting the user.

**`POST /students` — Why?**
HOD creates individual students. This creates BOTH a `Student` record (academic data) AND a `User` record (login credentials) — the student's regNo becomes their username.

**`POST /upload-students` — Why?**
Bulk student creation from CSV files. Parses CSV, validates data, creates student + user records, and reports how many were created vs. skipped (duplicates).

**`POST /reset-password` — Why?**
If a faculty or student forgets their password, the HOD can reset it without needing email-based recovery (which would require email infrastructure).

---

#### `PrincipalController` (`/api/principal`)

**`GET /dashboard` — Why?**
The principal needs institution-wide statistics: per-department student counts, faculty counts, CIE completion rates, top performers, at-risk students. This single endpoint aggregates data across ALL departments.

**HOD CRUD (`/hods`) — Why?**
The principal manages HODs — creates new ones, updates their departments, and deletes them. Deleting an HOD cascades to clean up related attendance records to avoid foreign key violations.

---

#### `CieController` (`/api/cie`)

**`POST /faculty/announce` — Why?**
When faculty creates an exam announcement, this also creates notification records for all students in that subject's department/semester. Students see the notification on their dashboard immediately.

**`POST /faculty/syllabus` and `/hod/syllabus` — Why?**
Faculty and HOD can update the syllabus coverage for an exam. The `syllabusCoverage` field stores which topics are covered — students need this to prepare for the exam.

---

#### `NotificationController` (`/api/notifications`)

**`POST /broadcast` — Why?**
HODs can broadcast messages to all faculty in their department. Principals can broadcast to all faculty/HODs across the institution or in a specific department. This creates individual `Notification` records for each target user.

**Why individual records instead of one broadcast record?** Because each user needs their own read/unread status and the ability to delete their copy of the notification.

---

### 3.7 Security Architecture (Detailed)

#### How JWT Authentication Works — Step by Step

```
1. User enters username + password on login page
2. Frontend sends POST /api/auth/login {username, password}
3. AuthController calls AuthService.authenticateUser()
4. Spring's AuthenticationManager:
   a. Calls UserDetailsServiceImpl.loadUserByUsername() → fetches User from DB
   b. Compares entered password with BCrypt hash using BCryptPasswordEncoder
   c. If match → returns Authentication object
   d. If no match → throws AuthenticationException → returns 401
5. JwtUtils.generateJwtToken() creates a signed JWT containing the username
6. Returns JwtResponse {token, id, username, role, department, fullName}
7. Frontend stores the token in localStorage

For every subsequent request:
8. Frontend adds header: Authorization: Bearer <token>
9. AuthTokenFilter intercepts the request
10. Extracts token from the Authorization header
11. JwtUtils.validateJwtToken() verifies the signature hasn't been tampered with
12. JwtUtils.getUserNameFromJwtToken() extracts the username from the token
13. UserDetailsServiceImpl loads the user from DB
14. SecurityContextHolder stores the authenticated user
15. The controller method executes with the authenticated user context
16. @PreAuthorize("hasRole('HOD')") checks if the user has the required role
```

#### `WebSecurityConfig` — Why Each Setting?

| Setting | Why |
|---------|-----|
| `csrf.disable()` | CSRF protection is needed for cookie-based auth. We use JWT tokens in headers, so CSRF doesn't apply. |
| `sessionCreationPolicy(STATELESS)` | No server-side sessions. Each request is authenticated independently via JWT. This makes the server stateless and scalable. |
| `/api/auth/**` permitAll | Login and signup must be accessible without authentication (users don't have a token yet). |
| `/api/debug/**` permitAll | Debug endpoints are public for development troubleshooting. |
| `anyRequest().authenticated()` | Everything else requires a valid JWT token. |
| CORS allow all origins | The frontend (port 3000) and backend (port 8084) are on different ports (different origins). Without CORS configuration, the browser would block the requests. |

---

## 4. Frontend — React (Detailed)

### 4.1 How Authentication Works in React

**`AuthContext.js` — Why?**
When a user logs in, we need to remember their identity across ALL components (sidebar, dashboard, API calls). React's Context API provides this global state.

**`login()` function flow:**
1. Sends POST to `/api/auth/login`
2. Response: `{token, username, role, department, fullName}`
3. Converts role to lowercase (`HOD` → `hod`) because the frontend uses lowercase internally
4. Stores in React state (`setUser()`) — triggers re-render of all components
5. Stores in `localStorage` — persists across page refreshes
6. Returns `{success: true, role}` — the Login page reads this to redirect to the correct dashboard

**`useAuth()` hook — Why?**
Any component can call `const { user, login, logout } = useAuth()` to access the current user. For example, `FacultyDashboard` reads `user.token` to add the JWT to API requests, and `user.department` to fetch department-specific data.

---

### 4.2 How Routing & Protection Works

**`App.js` — Why the structure?**
```jsx
<AuthProvider>        // Makes auth state available everywhere
  <ThemeProvider>     // Makes theme (dark/light) available everywhere
    <Router>          // Enables client-side routing
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        ...
      </Routes>
    </Router>
  </ThemeProvider>
</AuthProvider>
```

**`ProtectedRoute.js` — Why?**
Wraps dashboard routes. Checks:
1. Is the user logged in? If not → redirect to `/login`
2. Does the user's role match `allowedRoles`? If not → redirect to `/login`

This prevents a student from manually typing `/dashboard/hod` in the URL and accessing the HOD dashboard.

---

### 4.3 Frontend Pages — What Each Section Does & Why

#### Login Page (`Login.js`)
- Single login form for all roles
- After login, reads the role from the response and navigates to the correct dashboard
- Stores JWT token for subsequent API calls

#### Student Dashboard (`StudentDashboard.js`)

| Section | What It Does | Why |
|---------|-------------|-----|
| **Overview** | Shows CIE marks summary with attendance % in a card layout | Students need a quick glance at their academic standing |
| **CIE Marks Table** | Detailed table: Subject → CIE-1 through CIE-5 → Total → Att% | Students need to see individual exam scores to track progress |
| **Exam Schedule** | Lists upcoming and past CIE exams with date, time, room, syllabus coverage | Students need to know when, where, and what to study for exams |
| **My Faculty** | Shows assigned faculty names, subjects, and emails | Students need to contact faculty for doubts or issues |
| **Notifications** | In-app messages from HOD/Principal | Communication channel without requiring personal phone numbers |

**Key API calls:**
- `GET /api/marks/my-marks` — fetches the student's marks
- `GET /api/cie/student/announcements` — fetches exam schedules
- `GET /api/student/faculty` — fetches faculty list
- `GET /api/notifications` — fetches notifications

#### Faculty Dashboard (`FacultyDashboard.js`)

This is the largest file (178 KB) because faculty has the most interactive features.

| Section | What It Does | Why |
|---------|-------------|-----|
| **Overview** | Quick stats — CIE status badges, class analytics summary | Faculty needs at-a-glance view of their workload and class performance |
| **CIE Entry** | Editable table: students × CIE columns + Att% input. Save & Submit buttons | This is the CORE FUNCTION — faculty enters marks here. Save persists to DB without submitting for approval. Submit locks marks and sends to HOD |
| **My Students** | Student list with regNo, name, section, email, phone | Faculty needs student contact info and reference data |
| **CIE Schedule** | Create/manage exam announcements with date, time, room, syllabus | Faculty schedules exams and communicates to students |
| **Notifications** | Send/receive notifications | Two-way communication with HOD |
| **Cross-Department** | Request to teach in other departments | Enables inter-department teaching assignments |

**Key functions in CIE Entry:**
- `handleMarkChange(studentId, cieType, value)` — Updates marks in local state as faculty types. Value is validated (0-50 range). This provides instant UI feedback without API calls.
- `prepareAndSaveMarks()` — Collects all changed marks, creates `MarkUpdateDto` objects, sends `POST /api/marks/update/batch`. Only sends records that have actual values (skips empty cells).
- `handleSubmitCie(cieType)` — After saving, faculty clicks "Submit" → `POST /api/marks/submit`. This changes status to SUBMITTED.

**Why save and submit are separate?** Faculty may enter marks over multiple sessions — saving allows them to come back later. Submit is the final action that triggers HOD review.

#### HOD Dashboard (`HODDashboard.js`)

| Section | What It Does | Why |
|---------|-------------|-----|
| **Overview** | Department summary with charts and stats | HOD needs to monitor department health |
| **Faculty Management** | Add, edit, delete faculty. Assign subjects and sections | HOD manages who teaches what |
| **Student Management** | Add, delete, CSV upload students | HOD manages student enrollment |
| **IA Monitoring** | View all marks per subject. Approve/reject/unlock CIE marks | THE KEY HOD FUNCTION — quality gate for marks |
| **CIE Schedule** | Create/manage exam announcements for the department | HOD coordinates exam schedules |
| **Approvals** | Review cross-department assignment requests | HOD controls who teaches in their department |
| **Subjects** | CRUD subjects for the department | HOD manages the curriculum catalog |
| **Notifications** | Broadcast messages to faculty | Department-wide communication |

**Key functions in IA Monitoring:**
- Marks approval flow: HOD sees SUBMITTED marks → clicks Approve (`POST /api/marks/approve`) or Reject (`POST /api/marks/reject`)
- Unlock: If approved marks need correction → `POST /api/marks/unlock` → resets to PENDING

#### Principal Dashboard (`PrincipalDashboard.js`)

| Section | What It Does | Why |
|---------|-------------|-----|
| **Overview** | Cross-department comparison: student counts, faculty counts, CIE completion rates | Principal monitors the entire institution |
| **HOD Management** | Add, edit, delete HODs | Principal manages department leadership |
| **Notifications** | Broadcast to all departments or specific ones | Institution-wide announcements |

---

## 5. How The Full Application Works Together

### Complete Flow: Faculty Enters Marks → Student Views Marks

```
Step 1: Faculty logs in
  → Frontend sends POST /api/auth/login {username: "faculty_cs", password: "..."}
  → Backend validates, returns JWT token + role=FACULTY
  → Frontend stores token, redirects to /dashboard/faculty

Step 2: Faculty dashboard loads
  → GET /api/faculty/my-subjects (with JWT header)
  → Backend checks JWT → valid → checks @PreAuthorize("hasRole('FACULTY')") → passes
  → Returns subjects: [{id:1, name:"Data Structures"}, {id:2, name:"DBMS"}]

Step 3: Faculty selects "Data Structures" and CIE-1 tab
  → GET /api/marks/subject/1
  → Returns existing marks (may be empty for CIE-1 if first time)
  → GET /api/student/all?department=CS
  → Frontend displays editable table: students × marks + attendance

Step 4: Faculty enters marks and clicks "Save"
  → POST /api/marks/update/batch
  → Body: [{studentId:1, subjectId:1, iaType:"CIE1", co1:45, attendancePercentage:92}, ...]
  → Backend upserts CieMark records with status=PENDING
  → Marks saved but NOT visible to students or HOD

Step 5: Faculty clicks "Submit CIE-1"
  → POST /api/marks/submit?subjectId=1&cieType=CIE1
  → Backend changes status: PENDING → SUBMITTED
  → Now visible to HOD

Step 6: HOD logs in, goes to "IA Monitoring"
  → GET /api/marks/pending?department=CS
  → Sees submitted marks for Data Structures CIE-1
  → Reviews marks, clicks "Approve"
  → POST /api/marks/approve?subjectId=1&iaType=CIE1
  → Backend changes status: SUBMITTED → APPROVED

Step 7: Student logs in
  → GET /api/marks/my-marks
  → Backend returns only non-PENDING marks
  → Student sees: "Data Structures CIE-1: 45/50, Attendance: 92%"
```

### Why This Workflow?
The multi-step approval process ensures **data quality**. Faculty might enter incorrect marks. The HOD review catches errors before students see them. The unlock mechanism allows corrections even after approval. This mirrors the paper-based process (faculty fills form → HOD signs → filed) but is faster and has an audit trail.

---

## Summary of All Functions & Their Purpose

| # | Layer | Function/Method | Purpose |
|---|-------|----------------|---------|
| 1 | Auth | `AuthService.authenticateUser()` | Validate login credentials, issue JWT |
| 2 | Auth | `AuthService.registerUser()` | Create new user account |
| 3 | Auth | `JwtUtils.generateJwtToken()` | Create signed JWT from authenticated user |
| 4 | Auth | `JwtUtils.validateJwtToken()` | Verify JWT signature and expiry |
| 5 | Auth | `AuthTokenFilter.doFilterInternal()` | Extract JWT from request header, set security context |
| 6 | Auth | `UserDetailsServiceImpl.loadUserByUsername()` | Load user from DB for Spring Security |
| 7 | Marks | `MarksService.updateBatchMarks()` | Save/update marks for multiple students at once |
| 8 | Marks | `MarksService.submitMarks()` | Change marks status PENDING → SUBMITTED |
| 9 | Marks | `MarksService.approveMarks()` | Change marks status SUBMITTED → APPROVED |
| 10 | Marks | `MarksService.rejectMarks()` | Change marks status SUBMITTED → REJECTED |
| 11 | Marks | `MarksService.unlockMarks()` | Reset approved marks back to PENDING for editing |
| 12 | Marks | `MarksService.getMarksBySubject()` | Fetch all marks for a subject |
| 13 | Marks | `MarksService.getMarksByStudentUsername()` | Fetch a student's visible marks |
| 14 | Marks | `MarksService.getPendingApprovals()` | Fetch submitted marks for HOD review |
| 15 | Faculty | `FacultyService.getSubjectsForFaculty()` | Get assigned subjects (home + cross-dept) |
| 16 | Faculty | `FacultyService.getStudentsForFaculty()` | Get students in assigned sections |
| 17 | Faculty | `FacultyService.getAnalytics()` | Calculate class performance statistics |
| 18 | Student | `StudentService.getAllStudents()` | List students by department |
| 19 | Student | `StudentService.getFacultyForStudent()` | Find faculty teaching student's subjects |
| 20 | Student | `StudentService.getStudentsWithAnalytics()` | Students with embedded marks data |
| 21 | CIE | `CieService.getStudentAnnouncements()` | Get exam schedules for student's subjects |
| 22 | CIE | `CieService.getFacultySchedules()` | Get exam schedules for faculty's subjects |
| 23 | HOD | `HodController.getOverview()` | Full department dashboard data |
| 24 | HOD | `HodController.createFaculty()` | Create new faculty user |
| 25 | HOD | `HodController.deleteFaculty()` | Delete faculty with cascade cleanup |
| 26 | HOD | `HodController.createStudent()` | Create student + user account |
| 27 | HOD | `HodController.uploadStudents()` | Bulk CSV student import |
| 28 | HOD | `HodController.approveAssignmentRequest()` | Approve cross-dept teaching request |
| 29 | Principal | `PrincipalController.getDashboard()` | Institution-wide analytics |
| 30 | Principal | `PrincipalController.createHod()` / `deleteHod()` | Manage HOD accounts |
| 31 | Analytics | `AnalyticsController.getDepartmentStats()` | Dept stats: pass %, at-risk count |
| 32 | Notify | `NotificationController.broadcastNotification()` | Send messages to multiple users |
| 33 | Frontend | `AuthContext.login()` | Authenticate and store session |
| 34 | Frontend | `handleMarkChange()` | Update marks in local state as faculty types |
| 35 | Frontend | `prepareAndSaveMarks()` | Collect marks and send batch save to API |
| 36 | Frontend | `ProtectedRoute` | Guard routes by authentication + role |
