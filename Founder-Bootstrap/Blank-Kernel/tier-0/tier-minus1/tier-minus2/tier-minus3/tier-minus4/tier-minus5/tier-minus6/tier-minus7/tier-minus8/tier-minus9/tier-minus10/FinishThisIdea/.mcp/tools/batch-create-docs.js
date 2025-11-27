/**
 * MCP Tool: Batch Create Documentation
 * Creates multiple documentation files using parallel agents
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

module.exports = {
    name: 'batch-create-docs',
    description: 'Create multiple documentation files in parallel using agent pool',
    
    parameters: {
        type: 'object',
        properties: {
            category: {
                type: 'string',
                description: 'Documentation category for all docs',
                enum: ['operations', 'troubleshooting', 'integrations']
            },
            documents: {
                type: 'array',
                description: 'List of documents to create',
                items: {
                    type: 'object',
                    properties: {
                        filename: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' }
                    },
                    required: ['filename', 'title', 'description']
                }
            },
            agentCount: {
                type: 'number',
                description: 'Number of parallel agents to use',
                default: 3,
                minimum: 1,
                maximum: 10
            }
        },
        required: ['category', 'documents']
    },
    
    async execute({ category, documents, agentCount = 3 }) {
        const projectRoot = process.env.PROJECT_ROOT || path.join(__dirname, '../..');
        const results = {
            success: true,
            created: [],
            failed: [],
            agents: [],
            summary: {
                total: documents.length,
                completed: 0,
                inProgress: 0,
                failed: 0
            }
        };
        
        try {
            // Step 1: Create agent pool
            console.log(`Creating ${agentCount} documentation agents...`);
            const agents = [];
            
            for (let i = 0; i < Math.min(agentCount, documents.length); i++) {
                const { stdout } = await execAsync(
                    './scripts/agent-coordinator.sh start docs',
                    { cwd: projectRoot }
                );
                const agentId = stdout.trim().split('\n').pop();
                agents.push({
                    id: agentId,
                    status: 'idle',
                    currentTask: null
                });
                console.log(`Created agent: ${agentId}`);
            }
            
            results.agents = agents;
            
            // Step 2: Create task queue
            const taskQueue = documents.map((doc, index) => ({
                ...doc,
                category,
                index,
                status: 'pending',
                assignedAgent: null
            }));
            
            // Step 3: Process tasks in parallel
            const processingPromises = [];
            
            // Function to assign and process next task
            const processNextTask = async (agent) => {
                const pendingTask = taskQueue.find(t => t.status === 'pending');
                if (!pendingTask) return;
                
                pendingTask.status = 'processing';
                pendingTask.assignedAgent = agent.id;
                agent.status = 'working';
                agent.currentTask = pendingTask.filename;
                results.summary.inProgress++;
                
                try {
                    const result = await processDocumentation(
                        agent.id,
                        category,
                        pendingTask,
                        projectRoot
                    );
                    
                    results.created.push({
                        filename: pendingTask.filename,
                        agent: agent.id,
                        path: result.path,
                        message: result.message
                    });
                    
                    pendingTask.status = 'completed';
                    results.summary.completed++;
                    results.summary.inProgress--;
                    
                } catch (error) {
                    results.failed.push({
                        filename: pendingTask.filename,
                        agent: agent.id,
                        error: error.message
                    });
                    
                    pendingTask.status = 'failed';
                    results.summary.failed++;
                    results.summary.inProgress--;
                }
                
                agent.status = 'idle';
                agent.currentTask = null;
                
                // Process next task if available
                await processNextTask(agent);
            };
            
            // Start processing with all agents
            for (const agent of agents) {
                processingPromises.push(processNextTask(agent));
            }
            
            // Wait for all processing to complete
            await Promise.all(processingPromises);
            
            // Step 4: Generate summary report
            const report = await generateBatchReport(results, projectRoot);
            
            return {
                ...results,
                report,
                nextSteps: [
                    'Review created documentation in worktrees',
                    'Run: ./scripts/agent-coordinator.sh status',
                    'Merge completed work: git merge agent/<agent-id>',
                    'Check dashboard: http://localhost:3333'
                ]
            };
            
        } catch (error) {
            results.success = false;
            results.error = error.message;
            return results;
        }
    }
};

async function processDocumentation(agentId, category, task, projectRoot) {
    // Map category to directory
    const categoryMap = {
        'operations': '08-operations',
        'troubleshooting': '09-troubleshooting',
        'integrations': '07-integrations'
    };
    
    const dir = categoryMap[category];
    const docPath = `docs/${dir}/${task.filename}.md`;
    
    // Assign task to agent
    await execAsync(
        `./scripts/agent-coordinator.sh assign "${docPath}"`,
        { cwd: projectRoot }
    );
    
    // Generate content
    const content = await generateDocContent(category, task);
    
    // Write content in agent's worktree
    const worktreePath = path.join(
        projectRoot, '..', 'finishthisidea-worktrees', agentId, docPath
    );
    await fs.mkdir(path.dirname(worktreePath), { recursive: true });
    await fs.writeFile(worktreePath, content, 'utf8');
    
    // Commit in worktree
    const worktreeRoot = path.join(
        projectRoot, '..', 'finishthisidea-worktrees', agentId
    );
    await execAsync(
        `cd "${worktreeRoot}" && git add "${docPath}" && git commit -m "docs: add ${task.filename} to ${category} section"`,
        { cwd: worktreeRoot }
    );
    
    // Update agent state
    const stateFile = path.join(projectRoot, '.agent-state', `${agentId}.json`);
    const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    state.tasks_completed = (state.tasks_completed || 0) + 1;
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf8');
    
    // Remove lock file
    const lockFile = path.join(projectRoot, '.agent-locks', `${task.filename}.md.lock`);
    try {
        await fs.unlink(lockFile);
    } catch (e) {
        // Lock file might not exist
    }
    
    return {
        path: docPath,
        message: `Documentation created by agent ${agentId}`
    };
}

async function generateDocContent(category, task) {
    const sections = getDefaultSections(category);
    
    let content = `# ${task.title}\n\n`;
    content += `## Overview\n\n${task.description}\n\n`;
    
    sections.forEach(section => {
        content += `## ${section}\n\n`;
        content += generateSectionContent(category, section);
        content += '\n\n';
    });
    
    // Add metadata
    content += `---\n\n`;
    content += `*Created: ${new Date().toISOString()}*\n`;
    content += `*Category: ${category}*\n`;
    content += `*Auto-generated by Batch Documentation System*\n`;
    
    return content;
}

function getDefaultSections(category) {
    switch (category) {
        case 'operations':
            return [
                'Prerequisites',
                'Setup Instructions',
                'Configuration',
                'Monitoring',
                'Maintenance Tasks',
                'Automation Scripts',
                'Troubleshooting',
                'Best Practices'
            ];
        case 'troubleshooting':
            return [
                'Symptoms',
                'Common Causes',
                'Diagnostic Steps',
                'Solutions',
                'Prevention',
                'Related Issues',
                'Getting Help'
            ];
        case 'integrations':
            return [
                'Overview',
                'Prerequisites',
                'Installation',
                'Configuration',
                'Authentication',
                'Usage Examples',
                'API Reference',
                'Common Issues'
            ];
        default:
            return ['Description', 'Usage', 'Examples', 'Notes'];
    }
}

function generateSectionContent(category, section) {
    // Generate appropriate template content based on section
    const templates = {
        'Prerequisites': `- Required software and versions
- Access permissions needed
- Environment setup requirements`,
        
        'Diagnostic Steps': `1. Check system logs
2. Verify configuration
3. Test connectivity
4. Review error messages`,
        
        'Usage Examples': `\`\`\`javascript
// Example code here
\`\`\``,
        
        'Configuration': `\`\`\`yaml
# Configuration example
service:
  enabled: true
  options:
    - setting: value
\`\`\``
    };
    
    return templates[section] || `[${section} content to be filled]`;
}

async function generateBatchReport(results, projectRoot) {
    const report = [];
    
    report.push('=== Batch Documentation Creation Report ===');
    report.push(`Total Documents: ${results.summary.total}`);
    report.push(`Completed: ${results.summary.completed}`);
    report.push(`Failed: ${results.summary.failed}`);
    report.push('');
    
    if (results.created.length > 0) {
        report.push('Successfully Created:');
        results.created.forEach(doc => {
            report.push(`  ✓ ${doc.filename} (Agent: ${doc.agent})`);
        });
    }
    
    if (results.failed.length > 0) {
        report.push('');
        report.push('Failed:');
        results.failed.forEach(doc => {
            report.push(`  ✗ ${doc.filename}: ${doc.error}`);
        });
    }
    
    report.push('');
    report.push('Agents Used:');
    results.agents.forEach(agent => {
        report.push(`  - ${agent.id} (Status: ${agent.status})`);
    });
    
    // Save report
    const reportPath = path.join(
        projectRoot,
        '.memory',
        `batch-docs-report-${Date.now()}.txt`
    );
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report.join('\n'), 'utf8');
    
    return report.join('\n');
}