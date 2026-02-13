const mysql = require('mysql2/promise');
require('dotenv').config();

async function listFaculty() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [faculty] = await connection.query('SELECT id, username, full_name, role FROM users WHERE role = "FACULTY"');
        console.log('Current Faculty:');
        console.log(JSON.stringify(faculty, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

listFaculty();
