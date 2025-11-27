// Privacy Sorter - Classifies documents by content sensitivity
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PrivacySorter {
    constructor() {
        // Sensitivity patterns and weights
        this.sensitivityPatterns = {
            high: {
                // Personally Identifiable Information
                ssn: { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, weight: 10, description: 'Social Security Number' },
                credit_card: { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, weight: 10, description: 'Credit Card Number' },
                bank_account: { pattern: /\b[0-9]{8,17}\b/g, weight: 8, description: 'Bank Account Number' },
                email: { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, weight: 3, description: 'Email Address' },
                phone: { pattern: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, weight: 3, description: 'Phone Number' },
                
                // Financial Information
                financial_terms: { pattern: /\b(salary|income|compensation|revenue|profit|loss|tax|invoice)\b/gi, weight: 5, description: 'Financial Terms' },
                monetary_values: { pattern: /\$[\d,]+(?:\.\d{2})?/g, weight: 4, description: 'Monetary Values' },
                
                // Medical Information
                medical_terms: { pattern: /\b(diagnosis|prescription|medical|health|patient|treatment|medication)\b/gi, weight: 7, description: 'Medical Terms' },
                
                // Legal Information
                legal_terms: { pattern: /\b(confidential|proprietary|copyright|trademark|patent|nda|agreement)\b/gi, weight: 6, description: 'Legal Terms' },
                
                // Credentials
                api_keys: { pattern: /\b(api[_\s]?key|apikey|api[_\s]?secret|access[_\s]?token)\s*[:=]\s*["']?[\w-]+["']?/gi, weight: 10, description: 'API Keys' },
                passwords: { pattern: /\b(password|passwd|pwd)\s*[:=]\s*["']?[\w-]+["']?/gi, weight: 10, description: 'Passwords' },
                private_keys: { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, weight: 10, description: 'Private Keys' }
            },
            
            medium: {
                // Business Information
                business_terms: { pattern: /\b(strategy|roadmap|planning|budget|forecast|projection)\b/gi, weight: 4, description: 'Business Terms' },
                company_names: { pattern: /\b(Inc\.|LLC|Corp\.|Corporation|Ltd\.?|Company)\b/g, weight: 3, description: 'Company Names' },
                
                // Personal Names (simplified detection)
                names: { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, weight: 2, description: 'Potential Names' },
                
                // Dates and Times
                dates: { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g, weight: 1, description: 'Dates' },
                
                // Internal References
                internal_refs: { pattern: /\b(internal|private|restricted|employee|staff)\b/gi, weight: 3, description: 'Internal References' }
            },
            
            low: {
                // Generic Technical Terms
                technical: { pattern: /\b(code|function|variable|method|class|interface)\b/gi, weight: 1, description: 'Technical Terms' },
                
                // Public Documentation
                documentation: { pattern: /\b(readme|documentation|guide|tutorial|example)\b/gi, weight: 0.5, description: 'Documentation Terms' },
                
                // General Business
                general_business: { pattern: /\b(product|service|customer|user|feature)\b/gi, weight: 0.5, description: 'General Business Terms' }
            }
        };
        
        // Classification thresholds
        this.thresholds = {
            high: 15,    // Score above this = high sensitivity
            medium: 5,   // Score above this = medium sensitivity
            low: 0       // Score above this = low sensitivity
        };
        
        // Default classifications by file type
        this.fileTypeDefaults = {
            '.env': 'private',
            '.key': 'private',
            '.pem': 'private',
            '.pfx': 'private',
            '.p12': 'private',
            '.crt': 'private',
            '.cer': 'private',
            '.sql': 'private',
            '.db': 'private',
            '.sqlite': 'private',
            '.log': 'internal',
            '.bak': 'internal',
            '.tmp': 'internal',
            '.cache': 'internal',
            '.md': 'public',
            '.txt': 'public',
            '.pdf': 'internal',
            '.doc': 'internal',
            '.docx': 'internal'
        };
        
        this.classificationLog = [];
    }
    
    async classifyDocument(filePath, content, metadata = {}) {
        console.log(`🔒 Classifying privacy for: ${path.basename(filePath)}`);
        
        try {
            // Check file type defaults first
            const ext = path.extname(filePath).toLowerCase();
            const defaultClassification = this.fileTypeDefaults[ext];
            
            // Analyze content sensitivity
            const sensitivityAnalysis = this.analyzeSensitivity(content);
            
            // Determine classification
            const classification = this.determineClassification(
                sensitivityAnalysis, 
                defaultClassification,
                metadata
            );
            
            // Generate privacy report
            const privacyReport = {
                filePath: filePath,
                filename: path.basename(filePath),
                extension: ext,
                classification: classification,
                sensitivity: sensitivityAnalysis,
                defaultClassification: defaultClassification,
                metadata: metadata,
                timestamp: new Date().toISOString(),
                recommendations: this.generateRecommendations(classification, sensitivityAnalysis)
            };
            
            // Log classification
            this.classificationLog.push(privacyReport);
            
            return privacyReport;
            
        } catch (error) {
            console.error(`❌ Error classifying ${filePath}: ${error.message}`);
            throw error;
        }
    }
    
    analyzeSensitivity(content) {
        const analysis = {
            score: 0,
            findings: {
                high: [],
                medium: [],
                low: []
            },
            summary: {
                high: 0,
                medium: 0,
                low: 0
            }
        };
        
        // Extract text content if object
        const text = typeof content === 'string' ? content : 
                    content.text || content.raw || JSON.stringify(content);
        
        // Check each sensitivity level
        for (const [level, patterns] of Object.entries(this.sensitivityPatterns)) {
            for (const [name, config] of Object.entries(patterns)) {
                const matches = text.match(config.pattern);
                
                if (matches && matches.length > 0) {
                    const finding = {
                        type: name,
                        description: config.description,
                        count: matches.length,
                        weight: config.weight,
                        score: matches.length * config.weight,
                        samples: this.sanitizeSamples(matches.slice(0, 3), name)
                    };
                    
                    analysis.findings[level].push(finding);
                    analysis.score += finding.score;
                    analysis.summary[level] += matches.length;
                }
            }
        }
        
        // Determine overall sensitivity level
        if (analysis.score >= this.thresholds.high) {
            analysis.level = 'high';
        } else if (analysis.score >= this.thresholds.medium) {
            analysis.level = 'medium';
        } else {
            analysis.level = 'low';
        }
        
        return analysis;
    }
    
    sanitizeSamples(samples, type) {
        // Sanitize sensitive data samples for safe logging
        return samples.map(sample => {
            switch (type) {
                case 'ssn':
                    return sample.replace(/\d/g, '*');
                case 'credit_card':
                    return sample.substring(0, 4) + '****' + sample.substring(sample.length - 4);
                case 'email':
                    const [user, domain] = sample.split('@');
                    return user.substring(0, 2) + '***@' + domain;
                case 'phone':
                    return sample.substring(0, 3) + '***' + sample.substring(sample.length - 4);
                case 'api_keys':
                case 'passwords':
                    return '[REDACTED]';
                case 'monetary_values':
                    return '$***.**';
                default:
                    return sample.substring(0, 20) + '...';
            }
        });
    }
    
    determineClassification(sensitivityAnalysis, defaultClassification, metadata) {
        // Priority order for classification
        const classifications = {
            'private': 3,      // Highest privacy - never share
            'internal': 2,     // Company internal only
            'restricted': 1,   // Limited sharing allowed
            'public': 0        // Safe to share publicly
        };
        
        let classification = 'public'; // Default to most permissive
        
        // Apply sensitivity-based classification
        if (sensitivityAnalysis.level === 'high') {
            classification = 'private';
        } else if (sensitivityAnalysis.level === 'medium') {
            classification = 'internal';
        } else if (sensitivityAnalysis.level === 'low' && sensitivityAnalysis.score > 0) {
            classification = 'restricted';
        }
        
        // Apply file type default if more restrictive
        if (defaultClassification && 
            classifications[defaultClassification] > classifications[classification]) {
            classification = defaultClassification;
        }
        
        // Apply metadata overrides (e.g., user specified)
        if (metadata.userClassification && 
            classifications[metadata.userClassification] > classifications[classification]) {
            classification = metadata.userClassification;
        }
        
        // Check for specific high-risk patterns that force private classification
        const forcePrivatePatterns = ['private_keys', 'api_keys', 'passwords', 'ssn', 'credit_card'];
        const hasHighRisk = sensitivityAnalysis.findings.high.some(finding => 
            forcePrivatePatterns.includes(finding.type) && finding.count > 0
        );
        
        if (hasHighRisk) {
            classification = 'private';
        }
        
        return classification;
    }
    
    generateRecommendations(classification, sensitivityAnalysis) {
        const recommendations = [];
        
        // Base recommendations by classification
        switch (classification) {
            case 'private':
                recommendations.push('Keep this document strictly private and encrypted');
                recommendations.push('Do not share without explicit authorization');
                recommendations.push('Consider redacting sensitive information before any sharing');
                break;
            case 'internal':
                recommendations.push('Limit access to internal team members only');
                recommendations.push('Use secure channels for sharing');
                recommendations.push('Review and redact sensitive sections if needed');
                break;
            case 'restricted':
                recommendations.push('Share only with authorized parties');
                recommendations.push('Consider removing personal identifiers');
                recommendations.push('Use watermarking or access controls');
                break;
            case 'public':
                recommendations.push('Safe for public sharing');
                recommendations.push('Consider adding copyright notice if applicable');
                break;
        }
        
        // Specific recommendations based on findings
        if (sensitivityAnalysis.findings.high.length > 0) {
            const types = sensitivityAnalysis.findings.high.map(f => f.description).join(', ');
            recommendations.push(`High-risk content detected: ${types}`);
            recommendations.push('Strongly recommend manual review before any distribution');
        }
        
        if (sensitivityAnalysis.findings.high.some(f => f.type === 'api_keys' || f.type === 'passwords')) {
            recommendations.push('⚠️ CRITICAL: Credentials detected - rotate immediately if exposed');
            recommendations.push('Use environment variables or secure vaults for credentials');
        }
        
        if (sensitivityAnalysis.findings.medium.some(f => f.type === 'business_terms')) {
            recommendations.push('Contains business-sensitive information');
            recommendations.push('Ensure NDAs are in place before external sharing');
        }
        
        return recommendations;
    }
    
    async classifyFolder(folderTree, docContents = {}) {
        console.log('📁 Classifying folder privacy...');
        
        const results = {
            totalFiles: 0,
            classifications: {
                private: [],
                internal: [],
                restricted: [],
                public: []
            },
            summary: {
                private: 0,
                internal: 0,
                restricted: 0,
                public: 0
            },
            highRiskFiles: [],
            recommendations: []
        };
        
        await this.traverseAndClassify(folderTree, docContents, results);
        
        // Generate folder-level recommendations
        results.recommendations = this.generateFolderRecommendations(results);
        
        return results;
    }
    
    async traverseAndClassify(node, docContents, results) {
        if (node.type === 'file') {
            results.totalFiles++;
            
            // Get content if available
            const content = docContents[node.path] || '';
            
            // Classify the file
            const classification = await this.classifyDocument(
                node.path, 
                content,
                { fileSize: node.metadata?.size }
            );
            
            // Add to results
            results.classifications[classification.classification].push({
                path: node.relativePath || node.path,
                sensitivity: classification.sensitivity.level,
                score: classification.sensitivity.score
            });
            
            results.summary[classification.classification]++;
            
            // Track high-risk files
            if (classification.sensitivity.level === 'high') {
                results.highRiskFiles.push({
                    path: node.relativePath || node.path,
                    findings: classification.sensitivity.findings.high,
                    recommendations: classification.recommendations
                });
            }
        }
        
        // Recursively process children
        if (node.children) {
            for (const child of node.children) {
                await this.traverseAndClassify(child, docContents, results);
            }
        }
    }
    
    generateFolderRecommendations(results) {
        const recommendations = [];
        
        // Overall privacy posture
        const privatePercent = (results.summary.private / results.totalFiles) * 100;
        const publicPercent = (results.summary.public / results.totalFiles) * 100;
        
        if (privatePercent > 50) {
            recommendations.push('⚠️ This folder contains predominantly private content');
            recommendations.push('Recommend encrypting the entire folder');
            recommendations.push('Implement strict access controls');
        } else if (privatePercent > 20) {
            recommendations.push('Mixed sensitivity content detected');
            recommendations.push('Consider separating private files into a secure subfolder');
        }
        
        if (results.highRiskFiles.length > 0) {
            recommendations.push(`🚨 ${results.highRiskFiles.length} high-risk files detected requiring immediate attention`);
            recommendations.push('Review and secure these files before any sharing or export');
        }
        
        if (publicPercent > 80) {
            recommendations.push('✅ Majority of content is safe for public sharing');
            recommendations.push('Consider open-sourcing or publishing if appropriate');
        }
        
        // Specific file type recommendations
        const hasCredentials = results.highRiskFiles.some(file => 
            file.findings.some(f => ['api_keys', 'passwords', 'private_keys'].includes(f.type))
        );
        
        if (hasCredentials) {
            recommendations.push('🔑 Credentials detected - implement secret management solution');
            recommendations.push('Never commit credentials to version control');
        }
        
        return recommendations;
    }
    
    generatePrivacyReport() {
        const report = {
            totalClassified: this.classificationLog.length,
            summary: {
                private: 0,
                internal: 0,
                restricted: 0,
                public: 0
            },
            sensitivityDistribution: {
                high: 0,
                medium: 0,
                low: 0
            },
            topFindings: {},
            timestamp: new Date().toISOString()
        };
        
        // Aggregate data from classification log
        for (const entry of this.classificationLog) {
            report.summary[entry.classification]++;
            report.sensitivityDistribution[entry.sensitivity.level]++;
            
            // Track top findings
            for (const level of ['high', 'medium', 'low']) {
                for (const finding of entry.sensitivity.findings[level]) {
                    const key = `${level}_${finding.type}`;
                    if (!report.topFindings[key]) {
                        report.topFindings[key] = {
                            level: level,
                            type: finding.type,
                            description: finding.description,
                            totalOccurrences: 0,
                            affectedFiles: 0
                        };
                    }
                    report.topFindings[key].totalOccurrences += finding.count;
                    report.topFindings[key].affectedFiles++;
                }
            }
        }
        
        // Sort top findings by occurrence
        report.topFindings = Object.values(report.topFindings)
            .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
            .slice(0, 10);
        
        return report;
    }
    
    exportClassificationResults(format = 'json') {
        const report = this.generatePrivacyReport();
        
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
                
            case 'csv':
                // Generate CSV format
                const csvLines = ['File,Classification,Sensitivity,Score'];
                for (const entry of this.classificationLog) {
                    csvLines.push([
                        entry.filename,
                        entry.classification,
                        entry.sensitivity.level,
                        entry.sensitivity.score
                    ].join(','));
                }
                return csvLines.join('\n');
                
            case 'markdown':
                // Generate Markdown report
                let md = '# Privacy Classification Report\n\n';
                md += `Generated: ${report.timestamp}\n\n`;
                md += `## Summary\n\n`;
                md += `Total Files Classified: ${report.totalClassified}\n\n`;
                md += `### Classification Distribution\n\n`;
                md += `- Private: ${report.summary.private}\n`;
                md += `- Internal: ${report.summary.internal}\n`;
                md += `- Restricted: ${report.summary.restricted}\n`;
                md += `- Public: ${report.summary.public}\n\n`;
                md += `### Top Findings\n\n`;
                for (const finding of report.topFindings) {
                    md += `- **${finding.description}** (${finding.level}): `;
                    md += `${finding.totalOccurrences} occurrences in ${finding.affectedFiles} files\n`;
                }
                return md;
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
}

module.exports = PrivacySorter;