/**
 * MCP Tool: Create Documentation with Agent
 * Automates the complete workflow: agent creation, task assignment, worktree management
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

module.exports = {
    name: 'create-doc-with-agent',
    description: 'Create documentation using the proper agent workflow automatically',
    
    parameters: {
        type: 'object',
        properties: {
            category: {
                type: 'string',
                description: 'Documentation category',
                enum: ['overview', 'architecture', 'services', 'implementation', 'deployment', 'api', 'integrations', 'operations', 'troubleshooting']
            },
            filename: {
                type: 'string',
                description: 'Filename for the documentation (without .md extension)'
            },
            title: {
                type: 'string',
                description: 'Title of the documentation'
            },
            description: {
                type: 'string',
                description: 'Brief description of what this documentation covers'
            },
            sections: {
                type: 'array',
                description: 'Main sections to include',
                items: { type: 'string' },
                default: []
            }
        },
        required: ['category', 'filename', 'title', 'description']
    },
    
    async execute({ category, filename, title, description, sections = [] }) {
        const projectRoot = process.env.PROJECT_ROOT || path.join(__dirname, '../..');
        
        // Map category to directory
        const categoryMap = {
            'overview': '01-overview',
            'architecture': '02-architecture',
            'services': '03-services',
            'implementation': '04-implementation',
            'deployment': '05-deployment',
            'api': '06-api',
            'integrations': '07-integrations',
            'operations': '08-operations',
            'troubleshooting': '09-troubleshooting'
        };
        
        const dir = categoryMap[category];
        if (!dir) {
            throw new Error(`Invalid category: ${category}`);
        }
        
        const docPath = `docs/${dir}/${filename}.md`;
        const fullPath = path.join(projectRoot, docPath);
        
        // Check if file already exists
        try {
            await fs.access(fullPath);
            return {
                success: false,
                error: 'File already exists',
                path: docPath,
                message: 'Use agent-coordinator to update existing files'
            };
        } catch (e) {
            // File doesn't exist, continue
        }
        
        try {
            // Step 1: Create a documentation agent
            console.log('Creating documentation agent...');
            const { stdout: agentOutput } = await execAsync(
                './scripts/agent-coordinator.sh start docs',
                { cwd: projectRoot }
            );
            
            const agentId = agentOutput.trim().split('\n').pop();
            console.log(`Agent created: ${agentId}`);
            
            // Step 2: Assign the documentation task
            console.log(`Assigning task: ${docPath}`);
            await execAsync(
                `./scripts/agent-coordinator.sh assign "${docPath}"`,
                { cwd: projectRoot }
            );
            
            // Step 3: Generate enhanced content
            const content = await generateEnhancedContent(category, title, description, sections);
            
            // Step 4: Write content in the agent's worktree
            const worktreePath = path.join(projectRoot, '..', 'finishthisidea-worktrees', agentId, docPath);
            await fs.mkdir(path.dirname(worktreePath), { recursive: true });
            await fs.writeFile(worktreePath, content, 'utf8');
            
            // Step 5: Commit in the worktree
            const worktreeRoot = path.join(projectRoot, '..', 'finishthisidea-worktrees', agentId);
            await execAsync(
                `cd "${worktreeRoot}" && git add "${docPath}" && git commit -m "docs: add ${filename} documentation for ${category}"`,
                { cwd: worktreeRoot }
            );
            
            // Step 6: Update agent state to complete
            const stateFile = path.join(projectRoot, '.agent-state', `${agentId}.json`);
            const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
            state.status = 'completed';
            state.current_task = null;
            state.tasks_completed = (state.tasks_completed || 0) + 1;
            await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf8');
            
            // Step 7: Remove lock file
            const lockFile = path.join(projectRoot, '.agent-locks', `${filename}.md.lock`);
            try {
                await fs.unlink(lockFile);
            } catch (e) {
                // Lock file might not exist
            }
            
            return {
                success: true,
                agentId,
                path: docPath,
                worktreePath,
                message: `Documentation created successfully by agent ${agentId}`,
                nextSteps: [
                    `Review in worktree: cd ../finishthisidea-worktrees/${agentId}`,
                    `Merge when ready: git merge agent/${agentId}`,
                    'Memory auto-updated via post-commit hook'
                ]
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }
};

async function generateEnhancedContent(category, title, description, sections) {
    let content = `# ${title}\n\n`;
    content += `## Overview\n\n${description}\n\n`;
    
    // Add category-specific sections if not provided
    if (sections.length === 0) {
        switch (category) {
            case 'operations':
                sections = ['Prerequisites', 'Setup Instructions', 'Configuration', 'Monitoring', 'Maintenance', 'Troubleshooting', 'Best Practices'];
                break;
            case 'troubleshooting':
                sections = ['Common Issues', 'Error Messages', 'Diagnostic Steps', 'Solutions', 'Prevention', 'Getting Help'];
                break;
            case 'integrations':
                sections = ['Prerequisites', 'Installation', 'Configuration', 'Authentication', 'Usage Examples', 'API Reference', 'Troubleshooting'];
                break;
            case 'api':
                sections = ['Endpoints', 'Authentication', 'Request Format', 'Response Format', 'Error Handling', 'Rate Limiting', 'Examples'];
                break;
            default:
                sections = ['Getting Started', 'Key Concepts', 'Implementation', 'Examples', 'Best Practices', 'Next Steps'];
        }
    }
    
    // Add sections with helpful prompts
    sections.forEach(section => {
        content += `## ${section}\n\n`;
        
        // Add section-specific templates
        switch (section.toLowerCase()) {
            case 'prerequisites':
                content += `Before you begin, ensure you have:\n\n`;
                content += `- Node.js version 18 or higher\n`;
                content += `- Access to required services\n`;
                content += `- Environment variables configured\n\n`;
                break;
            case 'setup instructions':
                content += `Follow these steps to get started:\n\n`;
                content += `1. **Step One**: Description\n`;
                content += `   \`\`\`bash\n   # Command here\n   \`\`\`\n\n`;
                content += `2. **Step Two**: Description\n`;
                content += `   \`\`\`bash\n   # Command here\n   \`\`\`\n\n`;
                break;
            case 'error messages':
                content += `### Common Error Messages\n\n`;
                content += `#### Error: [Error Name]\n`;
                content += `**Cause**: Explanation\n`;
                content += `**Solution**: Steps to resolve\n\n`;
                break;
            default:
                content += `[Content for ${section}]\n\n`;
        }
    });
    
    // Add metadata footer
    content += `---\n\n`;
    content += `## Additional Resources\n\n`;
    content += `- [Related Documentation](../README.md)\n`;
    content += `- [API Reference](../06-api/api-reference.md)\n`;
    content += `- [Troubleshooting Guide](../09-troubleshooting/common-issues.md)\n\n`;
    content += `---\n\n`;
    content += `*Created: ${new Date().toISOString()}*\n`;
    content += `*Category: ${category}*\n`;
    content += `*Auto-generated by FinishThisIdea Agent System*\n`;
    
    return content;
}