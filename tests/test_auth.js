const fetch = require('node-fetch');

(async () => {
    try {
        const res = await fetch("http://localhost:3000/api/v1/incidents", {
            method: "POST",
            headers: {
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ hazard: "flood", description: "test", latitude: 19, longitude: 74 })
        });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error(e);
    }
})();
