/**
 * MCP Tool: Check Duplicates
 * Scans for duplicate files and content
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

module.exports = {
    name: 'check-duplicates',
    description: 'Check for duplicate files in the project',
    
    parameters: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Directory to scan (relative to project root)',
                default: '.'
            },
            includeContent: {
                type: 'boolean',
                description: 'Check for content duplicates, not just filenames',
                default: true
            }
        }
    },
    
    async execute({ directory = '.', includeContent = true }) {
        const projectRoot = process.env.PROJECT_ROOT || path.join(__dirname, '../..');
        const scanPath = path.join(projectRoot, directory);
        
        const duplicates = {
            byName: {},
            byContent: {},
            summary: {
                totalFiles: 0,
                duplicateGroups: 0,
                wastedSpace: 0
            }
        };
        
        // Scan directory recursively
        async function scanDir(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(projectRoot, fullPath);
                
                // Skip certain directories
                if (entry.isDirectory()) {
                    if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                        continue;
                    }
                    await scanDir(fullPath);
                } else if (entry.isFile()) {
                    // Skip certain files
                    if (entry.name === '.DS_Store' || entry.name.endsWith('.log')) {
                        continue;
                    }
                    
                    duplicates.summary.totalFiles++;
                    
                    // Check filename duplicates
                    const filename = entry.name;
                    if (!duplicates.byName[filename]) {
                        duplicates.byName[filename] = [];
                    }
                    duplicates.byName[filename].push(relativePath);
                    
                    // Check content duplicates
                    if (includeContent) {
                        try {
                            const content = await fs.readFile(fullPath, 'utf8');
                            const hash = crypto.createHash('md5').update(content).digest('hex');
                            
                            if (!duplicates.byContent[hash]) {
                                duplicates.byContent[hash] = {
                                    files: [],
                                    size: (await fs.stat(fullPath)).size
                                };
                            }
                            duplicates.byContent[hash].files.push(relativePath);
                        } catch (e) {
                            // Skip binary or unreadable files
                        }
                    }
                }
            }
        }
        
        await scanDir(scanPath);
        
        // Process results
        const results = {
            duplicatesByName: [],
            duplicatesByContent: [],
            summary: duplicates.summary
        };
        
        // Find name duplicates
        for (const [name, paths] of Object.entries(duplicates.byName)) {
            if (paths.length > 1) {
                results.duplicatesByName.push({
                    filename: name,
                    locations: paths,
                    count: paths.length
                });
            }
        }
        
        // Find content duplicates
        for (const [hash, info] of Object.entries(duplicates.byContent)) {
            if (info.files.length > 1) {
                results.duplicatesByContent.push({
                    hash: hash.substring(0, 8),
                    files: info.files,
                    count: info.files.length,
                    size: info.size,
                    wastedSpace: info.size * (info.files.length - 1)
                });
                results.summary.wastedSpace += info.size * (info.files.length - 1);
                results.summary.duplicateGroups++;
            }
        }
        
        // Sort by wasted space
        results.duplicatesByContent.sort((a, b) => b.wastedSpace - a.wastedSpace);
        
        return {
            success: true,
            results,
            recommendations: generateRecommendations(results)
        };
    }
};

function generateRecommendations(results) {
    const recommendations = [];
    
    if (results.duplicatesByContent.length > 0) {
        recommendations.push({
            priority: 'high',
            issue: `Found ${results.summary.duplicateGroups} groups of duplicate files`,
            action: `Remove duplicates to save ${formatBytes(results.summary.wastedSpace)}`,
            command: './scripts/duplicate-detector.sh fix'
        });
    }
    
    if (results.duplicatesByName.length > 0) {
        recommendations.push({
            priority: 'medium',
            issue: `Found ${results.duplicatesByName.length} files with duplicate names`,
            action: 'Review and rename files to avoid confusion',
            files: results.duplicatesByName.slice(0, 5).map(d => d.filename)
        });
    }
    
    // Check for common duplicate patterns
    const testDuplicates = results.duplicatesByName.filter(d => 
        d.filename.includes('.test.') || d.filename.includes('.spec.')
    );
    
    if (testDuplicates.length > 0) {
        recommendations.push({
            priority: 'low',
            issue: 'Multiple test files with same name in different directories',
            action: 'Consider unique naming convention for test files'
        });
    }
    
    return recommendations;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}