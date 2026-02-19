const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function inspectDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        let output = '--- Database Schema Inspection ---\n\n';

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            output += `Table: ${tableName}\n`;
            const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
            output += createTable[0]['Create Table'];
            output += '\n\n-----------------------------------\n\n';
        }

        fs.writeFileSync('db_schema_detailed.txt', output);
        console.log('✓ Schema saved to db_schema_detailed.txt');

    } catch (error) {
        console.error('Inspection error:', error);
    } finally {
        await connection.end();
    }
}

inspectDB();
