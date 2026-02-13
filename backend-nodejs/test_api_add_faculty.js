const axios = require('axios'); // Assumes axios is installed, if not use native fetch

const API_URL = 'http://localhost:8083/api';

async function testAddFaculty() {
    try {
        console.log('1. Logging in as HOD...');
        // Need a valid HOD credential. Assuming 'hod_cs' exists from previous context or seed. 
        // If not, I'll need to create one or use an existing one.
        // Let's try to login with a known user.
        // If login fails, I might need to insert a user first.

        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                username: 'hod_cs', // Common pattern
                password: 'password123'
            });
            token = loginRes.data.token;
            console.log('Login successful. Token acquired.');
        } catch (e) {
            console.error('Login failed:', e.response ? e.response.data : e.message);
            // Create a temporary HOD user directly in DB if login fails?
            // For now, let's assume login works or use a hardcoded token if I can find one.
            return;
        }

        console.log('2. Adding new faculty with subjects...');
        const newFacultyData = {
            username: `test_fac_${Date.now()}`,
            fullName: 'Test Faculty API',
            email: `test_fac_${Date.now()}@college.edu`,
            password: 'password123',
            department: 'CS', // Valid dept
            designation: 'Assistant Professor',
            subjects: ['Engineering Maths-II', 'Python'] // Valid subjects
        };

        const addRes = await axios.post(`${API_URL}/hod/faculty`, newFacultyData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Add Faculty Response:', addRes.status, addRes.data);

        // 3. Verify if subjects were assigned
        // I can use my previous script logic or check via API
        // But since I added logs to the server, checking the server output is key.
        // Or I can verify by fetching the faculty list.

        console.log('3. Verifying via GET /hod/faculty...');
        const listRes = await axios.get(`${API_URL}/hod/faculty?department=CS`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const addedFac = listRes.data.find(f => f.username === newFacultyData.username);
        if (addedFac) {
            console.log('New Faculty Found:', addedFac);
            console.log('Assigned Subjects:', addedFac.subjects);
            if (addedFac.subjects && addedFac.subjects.length > 0) {
                console.log('SUCCESS: Subjects were assigned correctly via API.');
            } else {
                console.log('FAILURE: Subjects were NOT assigned.');
            }
        } else {
            console.log('FAILURE: New faculty not found in list.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

// Since axios might not be installed in the root, I'll use native fetch (available in Node 18+)
// Or require it from backend-nodejs/node_modules if available
async function run() {
    // Check if fetch is available
    if (typeof fetch === 'undefined') {
        console.error('Fetch API not available. Please run with Node 18+');
        return;
    }

    const API_URL = 'http://localhost:8083/api';

    try {
        console.log('1. Logging in as HOD...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'hod_cs', password: 'password123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful.');

        console.log('2. Adding new faculty with subjects...');
        const uniqueId = Date.now();
        const newFacultyData = {
            username: `test_fac_${uniqueId}`,
            fullName: 'Test Faculty API',
            email: `test_${uniqueId}@college.edu`,
            password: 'password123',
            department: 'CS',
            designation: 'Assistant Professor',
            subjects: ['Engineering Maths-II', 'Python']
        };

        const addRes = await fetch(`${API_URL}/hod/faculty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newFacultyData)
        });

        if (!addRes.ok) {
            console.error('Add Faculty Failed:', await addRes.text());
            return;
        }
        const addData = await addRes.json();
        console.log('Add Faculty Success:', addData);

        console.log('3. Verifying via GET /hod/faculty...');
        const listRes = await fetch(`${API_URL}/hod/faculty?department=CS`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const facultyList = await listRes.json();
        const addedFac = facultyList.find(f => f.username === newFacultyData.username);

        if (addedFac) {
            console.log('New Faculty Found:', addedFac.username);
            console.log('Assigned Subjects:', addedFac.subjects);
            if (addedFac.subjects && addedFac.subjects.includes('Python')) {
                console.log('SUCCESS: Subjects assigned correctly.');
            } else {
                console.log('FAILURE: Subjects MISSING.');
            }
        } else {
            console.log('FAILURE: Faculty not found.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
