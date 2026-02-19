const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Database Schema Inspection ---\n');

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            console.log(`Table: ${tableName}`);
            const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
            console.log(createTable[0]['Create Table']);
            console.log('\n-----------------------------------\n');
        }

    } catch (error) {
        console.error('Inspection error:', error);
    } finally {
        await connection.end();
    }
}

inspectDB();
