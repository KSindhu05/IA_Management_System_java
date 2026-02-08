const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
    try {
        // Connect without specifying database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // Create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        console.log(`✓ Database '${process.env.DB_NAME}' created successfully`);

        await connection.end();
    } catch (error) {
        console.error('✗ Error creating database:', error);
        process.exit(1);
    }
}

createDatabase();
