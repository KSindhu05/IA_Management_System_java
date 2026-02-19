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
        console.log('--- Database Diagnostics V2 ---\n');

        // 1. Find all FKs pointing to 'users' table
        console.log('Finding all Foreign Keys pointing to "users" table...');
        const [fks] = await connection.query(`
            SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_NAME = 'users' AND TABLE_SCHEMA = ?
        `, [process.env.DB_NAME]);

        console.log('Foreign Keys found:', JSON.stringify(fks, null, 2));
        console.log('\n');

        // 2. Identify faculty accounts
        const [faculty] = await connection.query('SELECT id, username, full_name FROM users WHERE role = "FACULTY"');
        console.log('Faculty accounts found:', JSON.stringify(faculty, null, 2));
        console.log('\n');

        // 3. Deep check for the first few faculty
        for (const fac of faculty.slice(0, 3)) {
            console.log(`\n>>> Checking specifics for faculty: ${fac.username} (ID: ${fac.id})`);

            for (const fk of fks) {
                const [usage] = await connection.query(`SELECT COUNT(*) as count FROM \`${fk.TABLE_NAME}\` WHERE \`${fk.COLUMN_NAME}\` = ?`, [fac.id]);
                if (usage[0].count > 0) {
                    console.log(`- Table [${fk.TABLE_NAME}] has ${usage[0].count} records linked via [${fk.COLUMN_NAME}]`);
                }
            }
        }

    } catch (error) {
        console.error('Diagnostic error:', error);
    } finally {
        await connection.end();
    }
}

runDiagnostics();
