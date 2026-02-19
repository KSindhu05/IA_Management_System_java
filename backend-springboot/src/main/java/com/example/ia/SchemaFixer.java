package com.example.ia;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaFixer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Running Smart SchemaFixer...");

        // === NOTIFICATIONS TABLE ===
        migrateColumn("notifications", "userId", "user_id", "BIGINT");
        migrateColumn("notifications", "createdAt", "created_at", "DATETIME");
        migrateColumn("notifications", "isRead", "is_read", "BIT(1)");
        migrateColumn("notifications", "updatedAt", "updated_at", "DATETIME");

        // === ANNOUNCEMENTS TABLE ===
        migrateColumn("announcements", "cieNumber", "cie_number", "VARCHAR(255)");
        migrateColumn("announcements", "scheduledDate", "scheduled_date", "DATE");
        migrateColumn("announcements", "startTime", "start_time", "VARCHAR(255)");
        migrateColumn("announcements", "durationMinutes", "duration_minutes", "INT");
        migrateColumn("announcements", "examRoom", "exam_room", "VARCHAR(255)");

        // Fix FK columns in Announcements
        migrateColumn("announcements", "subjectId", "subject_id", "BIGINT");
        migrateColumn("announcements", "facultyId", "faculty_id", "BIGINT");

        // Fix timestamp columns in Announcements
        migrateColumn("announcements", "createdAt", "created_at", "DATETIME");
        migrateColumn("announcements", "updatedAt", "updated_at", "DATETIME");
    }

    private void dropForeignKey(String tableName, String columnName) {
        try {
            // Find the constraint name dynamically from information_schema
            String sql = "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? " +
                    "AND REFERENCED_TABLE_NAME IS NOT NULL";

            java.util.List<String> constraints = jdbcTemplate.query(sql,
                    (rs, rowNum) -> rs.getString("CONSTRAINT_NAME"), tableName, columnName);

            for (String constraint : constraints) {
                System.out.println(
                        "Found FK constraint " + constraint + " on " + tableName + "." + columnName + ". Dropping...");
                jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP FOREIGN KEY " + constraint);
            }

            // Also attempt to drop the index, which often has the same name or the column
            // name
            try {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP INDEX " + columnName);
            } catch (Exception e) {
                // Ignore if index doesn't exist
            }

        } catch (Exception e) {
            System.out.println("Error dropping FK for " + tableName + "." + columnName + ": " + e.getMessage());
        }
    }

    private void migrateColumn(String tableName, String oldName, String newName, String typeDef) {
        try {
            // 1. Check if OLD column exists
            if (!checkColumnExists(tableName, oldName)) {
                return;
            }

            System.out.println(
                    "Found legacy column " + oldName + " in " + tableName + ". Migrating to " + newName + "...");

            // 2. Ensure NEW column exists
            if (!checkColumnExists(tableName, newName)) {
                System.out.println("Creating new column " + newName + "...");
                jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + newName + " " + typeDef);
            }

            // 3. Copy Data (if old text/value is compatible)
            try {
                System.out.println("Copying data from " + oldName + " to " + newName + "...");
                jdbcTemplate.execute(
                        "UPDATE " + tableName + " SET " + newName + " = " + oldName + " WHERE " + newName + " IS NULL");
            } catch (Exception e) {
                System.out.println("Data copy warning: " + e.getMessage());
            }

            // 4. Drop Foreign Keys dynamically
            dropForeignKey(tableName, oldName);

            // 5. Drop OLD column
            System.out.println("Dropping legacy column " + oldName + "...");
            jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP COLUMN " + oldName);
            System.out.println("Success! Fixed " + oldName);

        } catch (Exception e) {
            System.out.println("Migration failed for " + oldName + ": " + e.getMessage());
        }
    }

    private boolean checkColumnExists(String tableName, String columnName) {
        try {
            java.util.List<String> found = jdbcTemplate.query(
                    "SHOW COLUMNS FROM " + tableName + " LIKE '" + columnName + "'",
                    (rs, rowNum) -> rs.getString("Field"));
            return !found.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}
