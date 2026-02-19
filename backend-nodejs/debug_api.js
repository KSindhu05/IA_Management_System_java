const http = require('http');

function makeRequest(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8084,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

(async () => {
    try {
        console.log("Attempting login as HOD001...");
        const loginRes = await makeRequest('/api/auth/signin', 'POST', {
            username: 'HOD001',
            password: 'password'
        });
        console.log("Login successful! Token received.");
        const token = loginRes.token || loginRes.accessToken;

        console.log("\nFetching CIE Timetables...");
        const timetables = await makeRequest('/api/principal/timetables', 'GET', null, token);
        console.log("Timetables fetched:", JSON.stringify(timetables, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
})();
