const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 8083,
    path: '/api/student/all?department=Computer%20Science%20%26%20Engineering', // URL Encoded
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};
// Note: HODDashboard uses 'selectedDept' variable. 
// If it is 'CS', url is '...?department=CS'.
// If 'Computer Science & Engineering', it is full string.
// I'll try both.

function check(dept) {
    const path = `/api/student/all?department=${encodeURIComponent(dept)}`;
    console.log(`Checking: ${path}`);

    const req = http.request({ ...options, path }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const students = JSON.parse(data);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Count: ${students.length}`);
                if (students.length > 0) {
                    const kavitha = students.find(s => s.regNo === '459CS25001');
                    if (kavitha) {
                        console.log('Found KAVITHA:', JSON.stringify(kavitha, null, 2));
                    } else {
                        console.log('KAVITHA not found in response.');
                        console.log('Sample:', students[0]);
                    }
                }
            } catch (e) {
                console.error('Error parsing JSON:', e);
                console.log('Raw:', data);
            }
        });
    });

    req.on('error', error => {
        console.error('Request Error:', error);
    });

    req.end();
}

// Check with 'CS' (likely what frontend uses by default?)
check('CS');
// Check with Full Name
setTimeout(() => check('Computer Science & Engineering'), 1000);
