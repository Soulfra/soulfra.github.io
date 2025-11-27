// validateMemory.js
// Validate incoming memory JSON payloads against ritualInteraction schema

function validateMemory(memoryPayload) {
    if (!memoryPayload.user_id || !memoryPayload.ritual_id || !memoryPayload.timestamp || !memoryPayload.input_text) {
        console.error('Invalid memory payload:', memoryPayload);
        return false;
    }
    return true;
}

export default validateMemory;
