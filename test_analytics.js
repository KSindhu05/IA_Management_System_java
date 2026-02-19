const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:8083/api';

async function testAnalytics() {
    try {
        console.log('Logging in as HOD...');
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'HOD001', password: 'password' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Token acquired.');

        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('\nTesting /analytics/department/CS/cie-trend:');
        const trendRes = await fetch(`${API_BASE_URL}/analytics/department/CS/cie-trend`, { headers });
        const trendData = await trendRes.json();
        console.log(JSON.stringify(trendData, null, 2));

        console.log('\nTesting /analytics/department/CS/subject-performance:');
        const perfRes = await fetch(`${API_BASE_URL}/analytics/department/CS/subject-performance`, { headers });
        const perfData = await perfRes.json();
        console.log('Number of subjects with performance:', perfData.length);
        if (perfData.length > 0) {
            console.log('Sample performance:', JSON.stringify(perfData[0], null, 2));
            const subjectId = perfData[0].id;
            console.log(`\nTesting /analytics/subject/${subjectId}/stats:`);
            const subRes = await fetch(`${API_BASE_URL}/analytics/subject/${subjectId}/stats`, { headers });
            const subData = await subRes.json();
            console.log(JSON.stringify(subData, null, 2));
        }

    } catch (e) {
        console.error('Test failed:', e);
    }
}

testAnalytics();
