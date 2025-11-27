// soulprintSnapshotter.js
// Capture periodic snapshots of user's soulprint for historical records

function soulprintSnapshotter(soulprintState) {
    return {
        snapshot_timestamp: new Date().toISOString(),
        soulprint: soulprintState
    };
}

export default soulprintSnapshotter;
