const mysql = require('mysql2/promise');
require('dotenv').config();

async function runDiagnostics() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Database Diagnostics ---\n');

        // 1. Find all FKs pointing to 'users' table
        console.log('Finding all Foreign Keys pointing to "users" table...');
        const [fks] = await connection.query(`
            SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_NAME = 'users' AND TABLE_SCHEMA = ?
        `, [process.env.DB_NAME]);

        console.log(JSON.stringify(fks, null, 2));
        console.log('\n');

        // 2. Identify the faculty user causing the issue (if possible)
        const [faculty] = await connection.query('SELECT id, username, fullName FROM users WHERE role = "FACULTY"');
        console.log('Faculty accounts found:', JSON.stringify(faculty, null, 2));
        console.log('\n');

        // 3. Check for specific problematic links for the first faculty
        if (faculty.length > 0) {
            const facId = faculty[0].id;
            console.log(`Checking specifics for faculty id: ${facId} (${faculty[0].username})`);

            for (const fk of fks) {
                const [usage] = await connection.query(`SELECT COUNT(*) as count FROM ${fk.TABLE_NAME} WHERE ${fk.COLUMN_NAME} = ?`, [facId]);
                console.log(`- Table ${fk.TABLE_NAME} usages: ${usage[0].count}`);
            }
        }

    } catch (error) {
        console.error('Diagnostic error:', error);
    } finally {
        await connection.end();
    }
}

runDiagnostics();
