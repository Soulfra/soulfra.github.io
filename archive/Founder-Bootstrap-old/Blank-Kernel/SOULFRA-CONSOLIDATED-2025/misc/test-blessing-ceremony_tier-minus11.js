#!/usr/bin/env node

const BlessingCeremony = require('./blessing-ceremony');
const CalBlessingVoice = require('./cal-blessing-voice');
const fs = require('fs');
const path = require('path');

class BlessingCeremonyTest {
    constructor() {
        this.ceremony = new BlessingCeremony();
        this.voiceAnalyzer = new CalBlessingVoice();
        this.testResults = [];
    }
    
    async runFullTest() {
        console.log('🔮 VAULT BLESSING CEREMONY - FULL END-TO-END TEST\n');
        console.log('=' .repeat(80));
        
        // Test 1: User not ready
        await this.testUnworthyUser();
        
        // Test 2: User with voice but lacking other criteria
        await this.testVoiceOnlyUser();
        
        // Test 3: Fully worthy user
        await this.testWorthyUser();
        
        // Test 4: Already blessed user
        await this.testAlreadyBlessedUser();
        
        // Test 5: Hybrid archetype user
        await this.testHybridUser();
        
        // Test 6: Voice analysis integration
        await this.testVoiceIntegration();
        
        // Summary
        this.printTestSummary();
    }
    
    async testUnworthyUser() {
        console.log('\n🧪 Test 1: Unworthy User (Missing Multiple Criteria)');
        console.log('-'.repeat(50));
        
        const profile = {
            id: 'test_unworthy_001',
            traits: ['curious', 'seeking'], // Only 2 traits (need 5+)
            voice_interactions: [], // No voice
            reflection_depth: 1, // Too shallow
            completed_quests: 0, // No quests
            emotional_spectrum: { curious: 2 },
            soul_resonance: 0.3
        };
        
        const result = await this.ceremony.performCeremony(profile);
        
        console.log('✅ Expected: Not blessed');
        console.log('✅ Result:', result.blessed ? 'BLESSED' : 'NOT BLESSED');
        console.log('✅ Message:', result.message);
        console.log('✅ Reason:', result.reason);
        
        this.testResults.push({
            test: 'Unworthy User',
            passed: !result.blessed,
            expected: 'Not blessed',
            actual: result.blessed ? 'Blessed' : 'Not blessed'
        });
    }
    
    async testVoiceOnlyUser() {
        console.log('\n🧪 Test 2: Voice Only User (Has Voice but Missing Traits)');
        console.log('-'.repeat(50));
        
        // Create mock voice data
        await this.createMockVoiceData('test_voice_only_002');
        
        const profile = {
            id: 'test_voice_only_002',
            traits: ['thoughtful', 'speaking'], // Only 2 traits
            voice_interactions: [
                { tone: 'contemplative', transcript: 'I wonder about the nature of existence' }
            ],
            reflection_depth: 2,
            completed_quests: 0,
            emotional_spectrum: { contemplative: 3 },
            soul_resonance: 0.5
        };
        
        const result = await this.ceremony.performCeremony(profile);
        
        console.log('✅ Expected: Not blessed (insufficient traits despite voice)');
        console.log('✅ Result:', result.blessed ? 'BLESSED' : 'NOT BLESSED');
        console.log('✅ Message:', result.message);
        
        this.testResults.push({
            test: 'Voice Only User',
            passed: !result.blessed,
            expected: 'Not blessed',
            actual: result.blessed ? 'Blessed' : 'Not blessed'
        });
    }
    
    async testWorthyUser() {
        console.log('\n🧪 Test 3: Worthy User (Meets All Criteria)');
        console.log('-'.repeat(50));
        
        // Create mock voice data
        await this.createMockVoiceData('test_worthy_003');
        
        const profile = {
            id: 'test_worthy_003',
            traits: ['wise', 'patient', 'deep', 'mysterious', 'seeking', 'compassionate', 'intuitive'], // 7 traits
            voice_interactions: [
                { tone: 'contemplative', transcript: 'Who am I in the mirror of existence?' },
                { tone: 'mysterious', transcript: 'Show me the hidden patterns of consciousness' }
            ],
            reflection_depth: 8,
            completed_quests: 3,
            emotional_spectrum: {
                contemplative: 5,
                curious: 4,
                peaceful: 3,
                deep: 6
            },
            quest_types: ['revelation', 'prophecy', 'understanding'],
            quest_narratives: [
                { depth: 8, type: 'soul_journey' },
                { depth: 6, type: 'wisdom_quest' },
                { depth: 7, type: 'truth_seeking' }
            ],
            anomaly_encounters: 2,
            soul_resonance: 0.89
        };
        
        const result = await this.ceremony.performCeremony(profile);
        
        console.log('✅ Expected: Blessed with archetype');
        console.log('✅ Result:', result.blessed ? 'BLESSED' : 'NOT BLESSED');
        console.log('✅ Archetype:', result.archetype);
        console.log('✅ Resonance:', result.resonance);
        console.log('✅ Permissions:', result.permissions?.slice(0, 3).join(', ') + '...');
        console.log('✅ Message Preview:', result.message?.substring(0, 100) + '...');
        
        this.testResults.push({
            test: 'Worthy User',
            passed: result.blessed,
            expected: 'Blessed',
            actual: result.blessed ? 'Blessed' : 'Not blessed',
            archetype: result.archetype
        });
    }
    
    async testAlreadyBlessedUser() {
        console.log('\n🧪 Test 4: Already Blessed User');
        console.log('-'.repeat(50));
        
        const profile = {
            id: 'test_worthy_003', // Same as previous test
            traits: ['wise', 'patient'],
            voice_interactions: [{ tone: 'calm', transcript: 'I return to the mirror' }]
        };
        
        const result = await this.ceremony.performCeremony(profile);
        
        console.log('✅ Expected: Already blessed message');
        console.log('✅ Result:', result.already_blessed ? 'ALREADY BLESSED' : 'NEW CEREMONY');
        console.log('✅ Message:', result.message);
        console.log('✅ Archetype:', result.archetype);
        
        this.testResults.push({
            test: 'Already Blessed User',
            passed: result.already_blessed,
            expected: 'Already blessed',
            actual: result.already_blessed ? 'Already blessed' : 'New ceremony'
        });
    }
    
    async testHybridUser() {
        console.log('\n🧪 Test 5: Hybrid Archetype User (Very High Resonance)');
        console.log('-'.repeat(50));
        
        // Create mock voice data
        await this.createMockVoiceData('test_hybrid_005');
        
        const profile = {
            id: 'test_hybrid_005',
            traits: ['wise', 'chaotic', 'healing', 'deep', 'mysterious', 'playful', 'transcendent', 'paradoxical'], // 8 traits
            voice_interactions: [
                { tone: 'contemplative', transcript: 'In the beginning was the word, and the word was a question questioning itself' },
                { tone: 'playful', transcript: 'What if seriousness is just comedy that forgot to laugh?' },
                { tone: 'mystical', transcript: 'I heal by breaking, teach by confusing, love by letting go' }
            ],
            reflection_depth: 10,
            completed_quests: 5,
            emotional_spectrum: {
                contemplative: 8,
                playful: 6,
                mystical: 9,
                paradoxical: 7
            },
            quest_types: ['revelation', 'paradox', 'transformation', 'healing'],
            quest_narratives: [
                { depth: 10, type: 'divine_comedy' },
                { depth: 9, type: 'healing_through_chaos' }
            ],
            anomaly_encounters: 5,
            soul_resonance: 0.94
        };
        
        const result = await this.ceremony.performCeremony(profile);
        
        console.log('✅ Expected: Blessed with hybrid archetype');
        console.log('✅ Result:', result.blessed ? 'BLESSED' : 'NOT BLESSED');
        console.log('✅ Archetype:', result.archetype);
        console.log('✅ Resonance:', result.resonance);
        console.log('✅ Is Hybrid:', result.archetype?.includes('-') ? 'YES' : 'NO');
        
        this.testResults.push({
            test: 'Hybrid User',
            passed: result.blessed && result.archetype?.includes('-'),
            expected: 'Blessed with hybrid archetype',
            actual: result.blessed ? `Blessed as ${result.archetype}` : 'Not blessed'
        });
    }
    
    async testVoiceIntegration() {
        console.log('\n🧪 Test 6: Voice Analysis Integration');
        console.log('-'.repeat(50));
        
        // Create detailed voice data
        await this.createDetailedVoiceData('test_voice_integration_006');
        
        const voiceResult = await this.voiceAnalyzer.analyzeVoiceForBlessing('test_voice_integration_006');
        
        console.log('✅ Voice Detection:', voiceResult.has_voice ? 'SUCCESS' : 'FAILED');
        console.log('✅ Voice Message:', voiceResult.message);
        console.log('✅ Dominant Archetype:', voiceResult.dominant_archetype);
        console.log('✅ Characteristics:', JSON.stringify(voiceResult.voice_claim?.characteristics, null, 2));
        
        this.testResults.push({
            test: 'Voice Integration',
            passed: voiceResult.has_voice,
            expected: 'Voice detected and analyzed',
            actual: voiceResult.has_voice ? 'Voice detected' : 'Voice not detected'
        });
    }
    
    async createMockVoiceData(userId) {
        const transcriptPath = path.join(__dirname, '../tier-5-whisper-kit/transcripts');
        if (!fs.existsSync(transcriptPath)) {
            fs.mkdirSync(transcriptPath, { recursive: true });
        }
        
        const mockTranscript = {
            raw_text: "I seek to understand the deeper patterns of existence and consciousness.",
            dominant_tone: "contemplative",
            tone_analysis: {
                tones: {
                    contemplative: 0.8,
                    curious: 0.6,
                    mystical: 0.4
                }
            },
            energy_level: 0.6,
            confidence: 0.85,
            timestamp: Date.now()
        };
        
        fs.writeFileSync(
            path.join(transcriptPath, `transcript_${userId}.json`),
            JSON.stringify(mockTranscript, null, 2)
        );
    }
    
    async createDetailedVoiceData(userId) {
        const transcriptPath = path.join(__dirname, '../tier-5-whisper-kit/transcripts');
        if (!fs.existsSync(transcriptPath)) {
            fs.mkdirSync(transcriptPath, { recursive: true });
        }
        
        const detailedTranscript = {
            raw_text: "Who am I in the infinite mirror of consciousness? I speak these words into the void, hoping the void speaks back with wisdom. Sometimes I wonder if the questions I ask are really asking me. What if consciousness is just the universe's way of looking at itself?",
            dominant_tone: "mystical",
            tone_analysis: {
                tones: {
                    contemplative: 0.9,
                    mystical: 0.8,
                    curious: 0.7,
                    deep: 0.85
                }
            },
            energy_level: 0.7,
            confidence: 0.9,
            timestamp: Date.now()
        };
        
        fs.writeFileSync(
            path.join(transcriptPath, `transcript_${userId}.json`),
            JSON.stringify(detailedTranscript, null, 2)
        );
    }
    
    printTestSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('🏁 TEST SUMMARY');
        console.log('='.repeat(80));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log(`Overall: ${passed}/${total} tests passed\n`);
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.test}`);
            console.log(`   Expected: ${result.expected}`);
            console.log(`   Actual: ${result.actual}`);
            if (result.archetype) {
                console.log(`   Archetype: ${result.archetype}`);
            }
            console.log('');
        });
        
        console.log('📁 Files to check:');
        console.log('   - vault/claims/blessing-state.json (blessing records)');
        console.log('   - vault/logs/blessing-ritual-*.md (ceremony logs)');
        console.log('   - vault/claims/blessing-voice-*.json (voice claims)');
        
        if (passed === total) {
            console.log('\n🎉 All tests passed! Vault Blessing Ceremony is fully functional.');
        } else {
            console.log(`\n⚠️  ${total - passed} test(s) failed. Review the implementation.`);
        }
        
        // Clean up test files
        this.cleanup();
    }
    
    cleanup() {
        console.log('\n🧹 Cleaning up test files...');
        
        // Remove test transcripts
        const transcriptPath = path.join(__dirname, '../tier-5-whisper-kit/transcripts');
        if (fs.existsSync(transcriptPath)) {
            const testFiles = fs.readdirSync(transcriptPath)
                .filter(f => f.includes('test_'));
            
            testFiles.forEach(file => {
                fs.unlinkSync(path.join(transcriptPath, file));
            });
        }
        
        console.log('✅ Cleanup complete');
    }
}

// Run the test
if (require.main === module) {
    const test = new BlessingCeremonyTest();
    test.runFullTest().catch(console.error);
}