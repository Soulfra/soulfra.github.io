/**
 * Rules Orchestrator Index
 * Export all orchestrator components for use in other modules
 */

const RulesOrchestrator = require('./RulesOrchestrator');
const FileSystemWatcher = require('./FileSystemWatcher');
const RulesEnforcer = require('./RulesEnforcer');
const TemplateGenerator = require('./TemplateGenerator');
const ValidationDaemon = require('./ValidationDaemon');

module.exports = {
    RulesOrchestrator,
    FileSystemWatcher,
    RulesEnforcer,
    TemplateGenerator,
    ValidationDaemon
};

// Convenience function to start orchestrator with default options
module.exports.start = function(options = {}) {
    const orchestrator = new RulesOrchestrator(options);
    return orchestrator;
};

// Check if we should auto-start (via environment variable)
if (process.env.SOULFRA_RULES_AUTOSTART === 'true') {
    console.log('🚀 Auto-starting SOULFRA Rules Orchestrator...');
    module.exports.start();
}