// postMemory.js
// Helper to POST ritual memory to Soulfra Memory Engine

async function postMemory(memoryPayload) {
    try {
        const response = await fetch('/api/memory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memoryPayload)
        });

        if (!response.ok) {
            console.error('Memory POST failed:', response.statusText);
            return null;
        }

        const data = await response.json();
        console.log('Memory successfully recorded:', data);
        return data;
    } catch (error) {
        console.error('Memory POST error:', error);
        return null;
    }
}

export default postMemory;
