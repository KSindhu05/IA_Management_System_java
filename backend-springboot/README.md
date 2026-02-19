# IA Management System - Spring Boot Backend

## Prerequisites
1.  **Java JDK 17+**: Ensure Java is installed and `JAVA_HOME` is set.
    -   Verify with: `java -version`
2.  **Apache Maven**: Required to build and run the project.
    -   Verify with: `mvn -version`
    -   If not installed, download from [maven.apache.org](https://maven.apache.org/download.cgi).
    -   Extract the zip.
    -   Add the `bin` folder to your System PATH variable.

## Configuration
1.  Open `src/main/resources/application.properties`.
2.  Update the database password:
    ```properties
    spring.datasource.password=YOUR_MYSQL_PASSWORD
    ```

## Running the Application
### Option A: Using Command Line (Maven)
1.  Open a terminal in this folder (`backend-springboot`).
2.  Run the application:
    ```bash
    mvn spring-boot:run
    ```
    To clean and build first:
    ```bash
    mvn clean install
    mvn spring-boot:run
    ```

### Option B: Using IntelliJ IDEA (Recommended)
1.  Open IntelliJ IDEA.
2.  Select **Open** and choose the `backend-springboot/pom.xml` file.
3.  Select **Open as Project**.
4.  Wait for dependencies to download.
5.  Run `IaManagementApplication.java`.

### Option C: Using Spring Tool Suite (STS) / Eclipse
1.  Open STS or Eclipse.
2.  Go to **File** -> **Import...**
3.  Select **Maven** -> **Existing Maven Projects**.
4.  Browse to the `backend-springboot` folder and click **Finish**.
5.  Wait for the project to build (look at the bottom right status bar).
6.  In the Project Explorer, find `src/main/java/com/example/ia/IaManagementApplication.java`.
7.  Right-click the file -> **Run As** -> **Spring Boot App** (or Java Application).

## API Documentation
Once running, the API is available at:
-   Base URL: `http://localhost:8080/api`
-   Example Endpoint: `http://localhost:8080/api/auth/login`
