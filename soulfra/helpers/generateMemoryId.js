// generateMemoryId.js
// Lightweight generator for unique memory event IDs

function generateMemoryId(userId) {
    const randomSegment = Math.random().toString(36).substring(2, 8);
    const timestampSegment = Date.now().toString(36);
    return `${userId}_${randomSegment}_${timestampSegment}`;
}

export default generateMemoryId;
