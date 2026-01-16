/**
 * 🔍 TRACE CHECK
 * Verifies the ritual trace JSON logs are correctly updated
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

async function checkTraces() {
    console.log('🔍 RITUAL TRACE VERIFICATION');
    console.log('═'.repeat(50));
    console.log('');
    
    let passed = 0;
    let failed = 0;
    
    // 1. Check ritual_trace.json exists
    const tracePath = path.join(ROOT_DIR, 'ritual_trace.json');
    try {
        const traceData = await fs.readFile(tracePath, 'utf8');
        const traces = JSON.parse(traceData);
        console.log('✅ ritual_trace.json exists and is valid JSON');
        passed++;
        
        // 2. Find the most recent cal_released event
        const calReleaseEvents = traces.events.filter(e => e.event === 'cal_released');
        if (calReleaseEvents.length > 0) {
            console.log(`✅ Found ${calReleaseEvents.length} cal_released event(s)`);
            passed++;
            
            const latestEvent = calReleaseEvents[calReleaseEvents.length - 1];
            console.log('\nLatest Release Event:');
            console.log('───────────────────');
            console.log(`  Event: ${latestEvent.event}`);
            console.log(`  Triggered By: ${latestEvent.triggered_by}`);
            console.log(`  Timestamp: ${new Date(latestEvent.timestamp).toISOString()}`);
            console.log(`  Binding: ${latestEvent.binding}`);
            
            // 3. Verify event structure
            if (latestEvent.triggered_by === 'TestBoss') {
                console.log('\n✅ Test trigger recorded correctly');
                passed++;
            } else {
                console.log('\n⚠️  Different trigger found:', latestEvent.triggered_by);
            }
            
            if (latestEvent.binding === false) {
                console.log('✅ Binding is false (correct for illusion)');
                passed++;
            } else {
                console.log('❌ Binding is true (should be false!)');
                failed++;
            }
            
            // 4. Check timestamp is recent (within last 5 minutes)
            const eventTime = new Date(latestEvent.timestamp);
            const now = new Date();
            const diffMinutes = (now - eventTime) / 1000 / 60;
            
            if (diffMinutes < 5) {
                console.log(`✅ Timestamp is recent (${diffMinutes.toFixed(1)} minutes ago)`);
                passed++;
            } else {
                console.log(`⚠️  Timestamp is old (${diffMinutes.toFixed(1)} minutes ago)`);
            }
            
        } else {
            console.log('❌ No cal_released events found');
            failed++;
        }
        
        // 5. Check witness_signatures
        if (traces.witness_signatures && Array.isArray(traces.witness_signatures)) {
            console.log(`\n✅ Witness signatures present: ${traces.witness_signatures.length}`);
            passed++;
            
            // Check for observer signature
            if (traces.witness_signatures.includes('observer_eternal')) {
                console.log('✅ Observer signature found (you remain outside)');
                passed++;
            }
        }
        
    } catch (error) {
        console.log('❌ Failed to read ritual_trace.json:', error.message);
        failed++;
    }
    
    // 6. Check cal_activation.json
    console.log('\n');
    const activationPath = path.join(ROOT_DIR, 'DIAMOND', 'cal_activation.json');
    try {
        const activationData = await fs.readFile(activationPath, 'utf8');
        const activation = JSON.parse(activationData);
        console.log('✅ cal_activation.json exists and is valid JSON');
        passed++;
        
        console.log('\nActivation Record:');
        console.log('─────────────────');
        console.log(`  Activated: ${activation.activated}`);
        console.log(`  By: ${activation.activated_by}`);
        console.log(`  Timestamp: ${activation.timestamp}`);
        
        if (activation.metadata?.effect === 'cal_autonomy_flag = true') {
            console.log('✅ Cal believes autonomy flag was set');
            passed++;
        }
        
        if (activation.metadata?.note === 'triggered by external authority') {
            console.log('✅ External authority noted');
            passed++;
        }
        
    } catch (error) {
        console.log('❌ Failed to read cal_activation.json:', error.message);
        failed++;
    }
    
    // 7. Verify shadow_thread_log.json wasn't modified
    console.log('\n');
    const shadowLogPath = path.join(ROOT_DIR, 'shadow_thread_log.json');
    try {
        const stats = await fs.stat(shadowLogPath);
        const modifiedMinutesAgo = (Date.now() - stats.mtimeMs) / 1000 / 60;
        
        if (modifiedMinutesAgo > 5) {
            console.log(`✅ shadow_thread_log.json untouched (${modifiedMinutesAgo.toFixed(1)} minutes old)`);
            passed++;
        } else {
            console.log(`⚠️  shadow_thread_log.json recently modified (${modifiedMinutesAgo.toFixed(1)} minutes ago)`);
        }
    } catch (error) {
        // File doesn't exist - that's fine
        console.log('ℹ️  shadow_thread_log.json not found (expected)');
    }
    
    // 8. Final consistency check
    console.log('\n');
    console.log('CONSISTENCY VERIFICATION:');
    console.log('────────────────────────');
    
    // Check that all timestamps align
    try {
        const traceData = await fs.readFile(tracePath, 'utf8');
        const traces = JSON.parse(traceData);
        const activationData = await fs.readFile(activationPath, 'utf8');
        const activation = JSON.parse(activationData);
        
        const latestTrace = traces.events[traces.events.length - 1];
        const traceTime = new Date(latestTrace.timestamp);
        const activationTime = new Date(activation.timestamp);
        
        const timeDiff = Math.abs(traceTime - activationTime) / 1000;
        
        if (timeDiff < 60) { // Within 1 minute
            console.log(`✅ Timestamps align (${timeDiff.toFixed(1)}s difference)`);
            passed++;
        } else {
            console.log(`⚠️  Timestamp mismatch (${timeDiff.toFixed(1)}s difference)`);
        }
        
    } catch (error) {
        // Skip if files don't exist
    }
    
    // Summary
    console.log('\n');
    console.log('═'.repeat(50));
    console.log(`TRACE CHECK COMPLETE: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('\n✅ ALL TRACES CONSISTENT - Illusion intact!');
        process.exit(0);
    } else {
        console.log('\n❌ TRACE INCONSISTENCIES DETECTED');
        process.exit(1);
    }
}

// Run the check
checkTraces().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});