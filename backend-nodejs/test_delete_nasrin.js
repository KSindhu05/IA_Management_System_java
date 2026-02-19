const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDeletion() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Find Nasrin Banu
        const [faculty] = await connection.query('SELECT id, username, full_name FROM users WHERE full_name LIKE "%Nasrin%" OR username = "FAC004"');
        console.log('Testing with faculty:', faculty);

        if (faculty.length === 0) {
            console.log('Nasrin Banu not found');
            return;
        }

        const facId = faculty[0].id;
        console.log(`\nAttempting to delete Nasrin Banu (id: ${facId})`);

        // Check links first
        const [fks] = await connection.query(`
            SELECT TABLE_NAME, COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_NAME = 'users' AND TABLE_SCHEMA = ?
        `, [process.env.DB_NAME]);

        for (const fk of fks) {
            const [usage] = await connection.query(`SELECT COUNT(*) as count FROM \`${fk.TABLE_NAME}\` WHERE \`${fk.COLUMN_NAME}\` = ?`, [facId]);
            if (usage[0].count > 0) {
                console.log(`- Table [${fk.TABLE_NAME}] has ${usage[0].count} records linked via [${fk.COLUMN_NAME}]`);
            }
        }

        // Try to delete directly
        try {
            await connection.query('DELETE FROM users WHERE id = ?', [facId]);
            console.log('SUCCESS: Nasrin Banu deleted');
        } catch (e) {
            console.log('CAUGHT EXPECTED ERROR:');
            console.log(e.message);
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await connection.end();
    }
}

testDeletion();
