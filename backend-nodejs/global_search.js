const mysql = require('mysql2/promise');
require('dotenv').config();

async function searchGlobal(value) {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log(`--- Global Search for Value: ${value} ---\n`);

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
            for (const column of columns) {
                const colName = column.Field;
                try {
                    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\` WHERE \`${colName}\` = ?`, [value]);
                    if (rows[0].count > 0) {
                        console.log(`Found ${rows[0].count} match(es) in [${tableName}.${colName}]`);
                    }
                } catch (e) {
                    // Skip if types don't match (e.g. searching string in int)
                }
            }
        }

    } catch (error) {
        console.error('Search error:', error);
    } finally {
        await connection.end();
    }
}

const targetValue = process.argv[2];
if (targetValue) {
    searchGlobal(targetValue);
} else {
    console.log('Provide a value to search');
}
