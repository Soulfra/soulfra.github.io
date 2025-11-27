// ADD THIS TO YOUR PLATFORM CODE

// Send errors to Claude Bridge
window.onerror = function(msg, url, line, col, error) {
    fetch('http://localhost:7777/error', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            message: msg,
            stack: error ? error.stack : '',
            source: url + ':' + line + ':' + col
        })
    });
};

// Send logs
function logToBridge(level, message, data) {
    fetch('http://localhost:7777/log', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            level: level,
            message: message,
            data: data || {}
        })
    });
}

// Update platform state
function updateBridgeState(state) {
    fetch('http://localhost:7777/state', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(state)
    });
}

// Example usage:
logToBridge('info', 'Game started');
logToBridge('error', 'Failed to load assets');
updateBridgeState({users_online: 42, games_active: 5});
