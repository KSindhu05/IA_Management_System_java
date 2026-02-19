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
        // Find a faculty user to test with (one that the user is actually seeing)
        const [faculty] = await connection.query('SELECT id, username FROM users WHERE role = "FACULTY" LIMIT 5');
        console.log('Testing with faculty:', faculty);

        if (faculty.length === 0) return;

        const facId = faculty[0].id;
        console.log(`\nAttempting to delete faculty id: ${facId}`);

        // Try to delete directly to see the FK error
        try {
            await connection.query('DELETE FROM users WHERE id = ?', [facId]);
            console.log('SUCCESS: Faculty deleted (Unexpected, should have failed if user is seeing error)');
        } catch (e) {
            console.log('CAUGHT EXPECTED ERROR:');
            console.log(e);
            console.log('\nError Code:', e.code);
            console.log('Error Message:', e.message);
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await connection.end();
    }
}

testDeletion();
