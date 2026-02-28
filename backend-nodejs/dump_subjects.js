const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sindhu@2006',
    database: 'ia_management_nodejs'
});

connection.query(
    "DELETE FROM cie_marks WHERE subject_id IN (SELECT id FROM subjects WHERE name LIKE 'Python%')",
    function (err, results) {
        if (err) throw err;
        console.log("DELETED marks for Python subjects: ", results.affectedRows);

        connection.query(
            "DELETE FROM subjects WHERE name LIKE 'Python%'",
            function (err, results) {
                if (err) throw err;
                console.log("DELETED Python subjects: ", results.affectedRows);
                connection.end();
            }
        );
    }
);
