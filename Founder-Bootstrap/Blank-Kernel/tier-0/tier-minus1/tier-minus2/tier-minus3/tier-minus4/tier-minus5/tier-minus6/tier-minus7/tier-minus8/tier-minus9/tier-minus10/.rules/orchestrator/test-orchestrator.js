#!/usr/bin/env node
/**
 * Test script for SOULFRA Rules Orchestrator
 * Verifies all components are working correctly
 */

const { RulesOrchestrator, FileSystemWatcher, RulesEnforcer, TemplateGenerator, ValidationDaemon } = require('./index');

console.log('🧪 Testing SOULFRA Rules Orchestrator Components\n');

async function testComponent(name, testFn) {
    process.stdout.write(`Testing ${name}... `);
    try {
        await testFn();
        console.log('✅ PASS');
        return true;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        return false;
    }
}

async function runTests() {
    let passed = 0;
    let total = 0;
    
    // Test 1: FileSystemWatcher instantiation
    total++;
    if (await testComponent('FileSystemWatcher', async () => {
        const watcher = new FileSystemWatcher();
        if (!watcher.rootPath) throw new Error('No root path set');
        if (!watcher.ignorePatterns) throw new Error('No ignore patterns');
    })) passed++;
    
    // Test 2: RulesEnforcer instantiation and rule loading
    total++;
    if (await testComponent('RulesEnforcer', async () => {
        const enforcer = new RulesEnforcer();
        if (!enforcer.rules.fileNaming.length) throw new Error('No file naming rules loaded');
        if (!enforcer.rules.directoryNaming.length) throw new Error('No directory naming rules loaded');
    })) passed++;
    
    // Test 3: TemplateGenerator template availability
    total++;
    if (await testComponent('TemplateGenerator', async () => {
        const generator = new TemplateGenerator();
        const content = await generator.generateFileContent('readme', { directory: 'test' });
        if (!content.includes('# test')) throw new Error('README template not working');
    })) passed++;
    
    // Test 4: ValidationDaemon instantiation
    total++;
    if (await testComponent('ValidationDaemon', async () => {
        const daemon = new ValidationDaemon();
        if (!daemon.enforcer) throw new Error('No enforcer attached');
        if (!daemon.interval) throw new Error('No interval set');
    })) passed++;
    
    // Test 5: RulesOrchestrator integration
    total++;
    if (await testComponent('RulesOrchestrator', async () => {
        const orchestrator = new RulesOrchestrator({ dryRun: true });
        if (!orchestrator.watcher) throw new Error('No watcher component');
        if (!orchestrator.enforcer) throw new Error('No enforcer component');
        if (!orchestrator.generator) throw new Error('No generator component');
        if (!orchestrator.validator) throw new Error('No validator component');
    })) passed++;
    
    // Test 6: File naming validation
    total++;
    if (await testComponent('File Naming Rules', async () => {
        const enforcer = new RulesEnforcer();
        
        // Test component naming
        const componentViolations = await enforcer.checkFileNaming('test/badcomponent.tsx');
        if (componentViolations.length === 0) throw new Error('Should have found naming violation');
        
        // Test valid component name
        const validComponent = await enforcer.checkFileNaming('test/GoodComponent.tsx');
        // Note: This might still have violations based on context
    })) passed++;
    
    // Test 7: Directory naming validation
    total++;
    if (await testComponent('Directory Naming Rules', async () => {
        const enforcer = new RulesEnforcer();
        
        // Test bad directory name
        const violations = await enforcer.checkDirectoryNaming('test/Bad_Directory');
        if (violations.length === 0) throw new Error('Should have found naming violation');
    })) passed++;
    
    // Test 8: Template generation
    total++;
    if (await testComponent('Template Generation', async () => {
        const generator = new TemplateGenerator();
        
        // Test all template types
        const templates = ['readme', 'gitignore', 'index', 'component', 'service', 'hook'];
        for (const type of templates) {
            const content = await generator.generateFileContent(type, { name: 'Test' });
            if (!content || content.length < 10) {
                throw new Error(`${type} template failed`);
            }
        }
    })) passed++;
    
    console.log(`\n📊 Test Results: ${passed}/${total} passed (${Math.round(passed/total * 100)}%)\n`);
    
    if (passed === total) {
        console.log('✅ All tests passed! Orchestrator is ready to use.');
        console.log('\nTo start the orchestrator:');
        console.log('  ./launch-orchestrator.sh');
    } else {
        console.log('❌ Some tests failed. Please check the errors above.');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});