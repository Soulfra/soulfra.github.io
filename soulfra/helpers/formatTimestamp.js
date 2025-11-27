// formatTimestamp.js
// Utility to create ISO-8601 timestamps

function formatTimestamp(date = new Date()) {
    return date.toISOString();
}

export default formatTimestamp;
