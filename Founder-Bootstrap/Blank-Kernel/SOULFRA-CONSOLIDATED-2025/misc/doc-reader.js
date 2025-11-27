// Document Reader - Multi-format document parser
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Would require these packages in production:
// const pdfParse = require('pdf-parse');
// const mammoth = require('mammoth');
// const textract = require('textract');

class DocReader {
    constructor() {
        this.supportedFormats = [
            '.txt', '.md', '.pdf', '.docx', '.doc', 
            '.rtf', '.json', '.yaml', '.yml', '.csv',
            '.html', '.htm', '.xml', '.log'
        ];
        
        this.extractors = {
            '.txt': this.extractText.bind(this),
            '.md': this.extractMarkdown.bind(this),
            '.pdf': this.extractPDF.bind(this),
            '.docx': this.extractDocx.bind(this),
            '.doc': this.extractDoc.bind(this),
            '.json': this.extractJSON.bind(this),
            '.yaml': this.extractYAML.bind(this),
            '.yml': this.extractYAML.bind(this),
            '.csv': this.extractCSV.bind(this),
            '.html': this.extractHTML.bind(this),
            '.htm': this.extractHTML.bind(this),
            '.xml': this.extractXML.bind(this),
            '.log': this.extractLog.bind(this)
        };
        
        this.metadata = {
            totalProcessed: 0,
            totalSize: 0,
            errors: []
        };
    }
    
    async processDocument(filePath, fileBuffer = null) {
        console.log(`📄 Processing document: ${path.basename(filePath)}`);
        
        const ext = path.extname(filePath).toLowerCase();
        
        if (!this.supportedFormats.includes(ext)) {
            throw new Error(`Unsupported file format: ${ext}`);
        }
        
        try {
            // Read file if buffer not provided
            if (!fileBuffer) {
                fileBuffer = await fs.readFile(filePath);
            }
            
            // Extract content based on file type
            const extractor = this.extractors[ext];
            const content = await extractor(fileBuffer, filePath);
            
            // Extract metadata
            const metadata = await this.extractMetadata(filePath, fileBuffer, content);
            
            // Analyze content
            const analysis = this.analyzeContent(content);
            
            this.metadata.totalProcessed++;
            this.metadata.totalSize += fileBuffer.length;
            
            return {
                path: filePath,
                filename: path.basename(filePath),
                extension: ext,
                size: fileBuffer.length,
                content: content,
                metadata: metadata,
                analysis: analysis,
                hash: this.generateHash(content),
                processedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            this.metadata.errors.push({
                file: filePath,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    async extractText(buffer, filePath) {
        return buffer.toString('utf8');
    }
    
    async extractMarkdown(buffer, filePath) {
        const text = buffer.toString('utf8');
        
        // Extract markdown structure
        const structure = {
            headers: this.extractMarkdownHeaders(text),
            codeBlocks: this.extractCodeBlocks(text),
            links: this.extractLinks(text),
            images: this.extractImages(text),
            lists: this.extractLists(text)
        };
        
        return {
            raw: text,
            structure: structure,
            plainText: this.markdownToPlainText(text)
        };
    }
    
    async extractPDF(buffer, filePath) {
        // In production, would use pdf-parse
        // For demo, return placeholder
        return {
            raw: '[PDF content would be extracted here]',
            pages: 1,
            text: 'This is a demo PDF extraction. In production, full PDF parsing would extract all text, metadata, and structure.',
            info: {
                title: path.basename(filePath, '.pdf'),
                format: 'PDF'
            }
        };
    }
    
    async extractDocx(buffer, filePath) {
        // In production, would use mammoth
        // For demo, return placeholder
        return {
            raw: '[DOCX content would be extracted here]',
            text: 'This is a demo DOCX extraction. In production, mammoth would extract formatted text while preserving structure.',
            paragraphs: [],
            tables: [],
            images: []
        };
    }
    
    async extractDoc(buffer, filePath) {
        // In production, would use textract
        // For demo, return placeholder
        return {
            raw: '[DOC content would be extracted here]',
            text: 'This is a demo DOC extraction. Legacy Word document parsing would extract text content.'
        };
    }
    
    async extractJSON(buffer, filePath) {
        try {
            const jsonData = JSON.parse(buffer.toString('utf8'));
            return {
                raw: buffer.toString('utf8'),
                parsed: jsonData,
                structure: this.analyzeJSONStructure(jsonData),
                text: JSON.stringify(jsonData, null, 2)
            };
        } catch (error) {
            throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
        }
    }
    
    async extractYAML(buffer, filePath) {
        // In production, would use js-yaml
        const text = buffer.toString('utf8');
        return {
            raw: text,
            text: text,
            structure: 'YAML structure analysis would be performed here'
        };
    }
    
    async extractCSV(buffer, filePath) {
        const text = buffer.toString('utf8');
        const lines = text.split('\n').filter(line => line.trim());
        
        const headers = lines[0]?.split(',').map(h => h.trim()) || [];
        const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
        
        return {
            raw: text,
            headers: headers,
            rows: rows,
            rowCount: rows.length,
            columnCount: headers.length,
            text: text
        };
    }
    
    async extractHTML(buffer, filePath) {
        const html = buffer.toString('utf8');
        
        // Basic HTML text extraction
        const textContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        return {
            raw: html,
            text: textContent,
            structure: {
                hasScripts: /<script/i.test(html),
                hasStyles: /<style/i.test(html),
                title: this.extractHTMLTitle(html)
            }
        };
    }
    
    async extractXML(buffer, filePath) {
        const xml = buffer.toString('utf8');
        
        return {
            raw: xml,
            text: xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            structure: 'XML structure analysis would be performed here'
        };
    }
    
    async extractLog(buffer, filePath) {
        const text = buffer.toString('utf8');
        const lines = text.split('\n');
        
        // Analyze log patterns
        const analysis = {
            totalLines: lines.length,
            errorLines: lines.filter(l => /error|exception|fail/i.test(l)).length,
            warningLines: lines.filter(l => /warn/i.test(l)).length,
            infoLines: lines.filter(l => /info/i.test(l)).length,
            timestamps: this.extractTimestamps(lines)
        };
        
        return {
            raw: text,
            text: text,
            lines: lines,
            analysis: analysis
        };
    }
    
    extractMarkdownHeaders(text) {
        const headers = [];
        const headerRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        
        while ((match = headerRegex.exec(text)) !== null) {
            headers.push({
                level: match[1].length,
                text: match[2],
                position: match.index
            });
        }
        
        return headers;
    }
    
    extractCodeBlocks(text) {
        const codeBlocks = [];
        const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
        let match;
        
        while ((match = codeRegex.exec(text)) !== null) {
            codeBlocks.push({
                language: match[1] || 'plain',
                code: match[2],
                position: match.index
            });
        }
        
        return codeBlocks;
    }
    
    extractLinks(text) {
        const links = [];
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = linkRegex.exec(text)) !== null) {
            links.push({
                text: match[1],
                url: match[2],
                position: match.index
            });
        }
        
        return links;
    }
    
    extractImages(text) {
        const images = [];
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = imageRegex.exec(text)) !== null) {
            images.push({
                alt: match[1],
                url: match[2],
                position: match.index
            });
        }
        
        return images;
    }
    
    extractLists(text) {
        const lists = [];
        const listRegex = /^(\s*)([-*+]|\d+\.)\s+(.+)$/gm;
        let match;
        
        while ((match = listRegex.exec(text)) !== null) {
            lists.push({
                indent: match[1].length,
                marker: match[2],
                text: match[3],
                position: match.index
            });
        }
        
        return lists;
    }
    
    extractHTMLTitle(html) {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        return titleMatch ? titleMatch[1] : null;
    }
    
    extractTimestamps(lines) {
        const timestamps = [];
        const timestampRegex = /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g;
        
        lines.forEach((line, index) => {
            const matches = line.match(timestampRegex);
            if (matches) {
                matches.forEach(timestamp => {
                    timestamps.push({
                        timestamp: timestamp,
                        line: index,
                        context: line
                    });
                });
            }
        });
        
        return timestamps;
    }
    
    markdownToPlainText(markdown) {
        return markdown
            .replace(/^#{1,6}\s+/gm, '') // Remove headers
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
            .replace(/^[-*+]\s+/gm, '') // Remove list markers
            .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
            .replace(/\*([^*]+)\*/g, '$1') // Remove italic
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }
    
    analyzeJSONStructure(obj, depth = 0, maxDepth = 10) {
        if (depth > maxDepth) return { type: 'deep_object' };
        
        const structure = {
            type: Array.isArray(obj) ? 'array' : typeof obj,
            depth: depth
        };
        
        if (Array.isArray(obj)) {
            structure.length = obj.length;
            if (obj.length > 0) {
                structure.itemType = this.analyzeJSONStructure(obj[0], depth + 1, maxDepth);
            }
        } else if (typeof obj === 'object' && obj !== null) {
            structure.keys = Object.keys(obj);
            structure.properties = {};
            
            for (const key of structure.keys.slice(0, 10)) { // Limit to first 10 keys
                structure.properties[key] = this.analyzeJSONStructure(obj[key], depth + 1, maxDepth);
            }
        }
        
        return structure;
    }
    
    async extractMetadata(filePath, buffer, content) {
        const stats = await fs.stat(filePath).catch(() => null);
        
        return {
            filename: path.basename(filePath),
            directory: path.dirname(filePath),
            extension: path.extname(filePath),
            size: buffer.length,
            sizeHuman: this.formatFileSize(buffer.length),
            created: stats?.birthtime || null,
            modified: stats?.mtime || null,
            encoding: this.detectEncoding(buffer),
            mimeType: this.getMimeType(filePath),
            hash: this.generateHash(buffer),
            wordCount: this.countWords(content),
            lineCount: this.countLines(content),
            characterCount: this.countCharacters(content)
        };
    }
    
    analyzeContent(content) {
        const text = typeof content === 'string' ? content : 
                    content.text || content.raw || JSON.stringify(content);
        
        return {
            tone: this.analyzeTone(text),
            topics: this.extractTopics(text),
            sentiment: this.analyzeSentiment(text),
            readability: this.analyzeReadability(text),
            language: this.detectLanguage(text),
            sensitivity: this.analyzeSensitivity(text),
            structure: this.analyzeStructure(text)
        };
    }
    
    analyzeTone(text) {
        const tones = {
            formal: this.calculateFormalityScore(text),
            technical: this.calculateTechnicalScore(text),
            educational: this.calculateEducationalScore(text),
            conversational: this.calculateConversationalScore(text),
            emotional: this.calculateEmotionalScore(text)
        };
        
        // Find dominant tone
        const dominant = Object.entries(tones)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        return {
            scores: tones,
            dominant: dominant,
            confidence: tones[dominant]
        };
    }
    
    calculateFormalityScore(text) {
        const formalIndicators = [
            /\b(therefore|furthermore|moreover|consequently|accordingly)\b/gi,
            /\b(shall|whereas|hereby|thereof|wherein)\b/gi,
            /\b(Mr\.|Mrs\.|Dr\.|Prof\.)\b/g
        ];
        
        let score = 0;
        formalIndicators.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) score += matches.length;
        });
        
        return Math.min(1, score / 100);
    }
    
    calculateTechnicalScore(text) {
        const technicalIndicators = [
            /\b(algorithm|function|variable|parameter|implementation)\b/gi,
            /\b(API|SDK|HTTP|JSON|XML)\b/g,
            /\b(database|server|client|protocol|framework)\b/gi
        ];
        
        let score = 0;
        technicalIndicators.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) score += matches.length;
        });
        
        return Math.min(1, score / 50);
    }
    
    calculateEducationalScore(text) {
        const educationalIndicators = [
            /\b(learn|understand|explain|example|tutorial)\b/gi,
            /\b(step\s+\d+|first|second|finally|in conclusion)\b/gi,
            /\b(how to|guide|lesson|exercise)\b/gi
        ];
        
        let score = 0;
        educationalIndicators.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) score += matches.length;
        });
        
        return Math.min(1, score / 50);
    }
    
    calculateConversationalScore(text) {
        const conversationalIndicators = [
            /\b(I|you|we|us|our)\b/gi,
            /\?/g,
            /!/g,
            /\b(hey|hi|hello|thanks|please)\b/gi
        ];
        
        let score = 0;
        conversationalIndicators.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) score += matches.length;
        });
        
        return Math.min(1, score / 100);
    }
    
    calculateEmotionalScore(text) {
        const emotionalIndicators = [
            /\b(feel|felt|feeling|emotion|love|hate|happy|sad)\b/gi,
            /[!]{2,}/g,
            /\b(amazing|terrible|wonderful|horrible|fantastic)\b/gi
        ];
        
        let score = 0;
        emotionalIndicators.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) score += matches.length;
        });
        
        return Math.min(1, score / 50);
    }
    
    extractTopics(text) {
        // Simple topic extraction based on frequent nouns and phrases
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const wordFreq = {};
        
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        // Get top topics
        const topics = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count, score: count / words.length }));
        
        return topics;
    }
    
    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'fantastic', 'love', 'best', 'amazing'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'poor', 'disappointing'];
        
        const words = text.toLowerCase().split(/\W+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        const total = positiveCount + negativeCount || 1;
        
        return {
            positive: positiveCount / total,
            negative: negativeCount / total,
            neutral: 1 - (positiveCount + negativeCount) / words.length,
            overall: positiveCount > negativeCount ? 'positive' : 
                    negativeCount > positiveCount ? 'negative' : 'neutral'
        };
    }
    
    analyzeReadability(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\W+/).filter(w => w.length > 0);
        const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
        
        // Flesch Reading Ease score
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
        const avgSyllablesPerWord = syllables / Math.max(words.length, 1);
        
        const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
        
        return {
            fleschScore: Math.max(0, Math.min(100, fleschScore)),
            avgWordsPerSentence: avgWordsPerSentence,
            avgSyllablesPerWord: avgSyllablesPerWord,
            level: fleschScore > 60 ? 'easy' : fleschScore > 30 ? 'moderate' : 'difficult'
        };
    }
    
    countSyllables(word) {
        // Simple syllable counting
        return word.toLowerCase().replace(/[^aeiou]/g, '').length || 1;
    }
    
    detectLanguage(text) {
        // Simple language detection based on common words
        const languages = {
            english: ['the', 'and', 'is', 'to', 'of', 'in', 'a', 'that'],
            spanish: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es'],
            french: ['le', 'de', 'la', 'et', 'un', 'pour', 'que', 'dans']
        };
        
        const words = text.toLowerCase().split(/\W+/);
        const scores = {};
        
        for (const [lang, commonWords] of Object.entries(languages)) {
            scores[lang] = commonWords.filter(w => words.includes(w)).length;
        }
        
        const detected = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])[0];
        
        return {
            language: detected[0],
            confidence: detected[1] / 8
        };
    }
    
    analyzeSensitivity(text) {
        // Check for potentially sensitive content
        const sensitivePatterns = {
            personal_info: /\b\d{3}-\d{2}-\d{4}\b|\b\d{16}\b|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            financial: /\$[\d,]+|credit card|bank account|ssn|social security/gi,
            medical: /\b(diagnosis|medical|health|prescription|patient)\b/gi,
            legal: /\b(confidential|proprietary|copyright|trademark)\b/gi,
            credentials: /\b(password|api[_\s]?key|secret|token|credential)\b/gi
        };
        
        const findings = {};
        let sensitivityLevel = 'low';
        
        for (const [category, pattern] of Object.entries(sensitivePatterns)) {
            const matches = text.match(pattern);
            if (matches) {
                findings[category] = matches.length;
                sensitivityLevel = 'high';
            }
        }
        
        return {
            level: sensitivityLevel,
            findings: findings,
            recommendation: sensitivityLevel === 'high' ? 'private' : 'public'
        };
    }
    
    analyzeStructure(text) {
        const lines = text.split('\n');
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        return {
            lines: lines.length,
            paragraphs: paragraphs.length,
            avgLinesPerParagraph: lines.length / Math.max(paragraphs.length, 1),
            hasHeaders: /^#{1,6}\s+/m.test(text),
            hasLists: /^[-*+]\s+/m.test(text) || /^\d+\.\s+/m.test(text),
            hasCode: /```[\s\S]*?```/.test(text) || /`[^`]+`/.test(text),
            hasLinks: /\[[^\]]+\]\([^)]+\)/.test(text),
            hasImages: /!\[[^\]]*\]\([^)]+\)/.test(text)
        };
    }
    
    detectEncoding(buffer) {
        // Simple encoding detection
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) return 'utf16le';
        if (buffer[0] === 0xFE && buffer[1] === 0xFF) return 'utf16be';
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) return 'utf8';
        
        // Check for common UTF-8 patterns
        try {
            buffer.toString('utf8');
            return 'utf8';
        } catch {
            return 'binary';
        }
    }
    
    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.json': 'application/json',
            '.yaml': 'text/yaml',
            '.yml': 'text/yaml',
            '.csv': 'text/csv',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.xml': 'application/xml',
            '.log': 'text/plain'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }
    
    generateHash(content) {
        const data = typeof content === 'string' ? content : 
                    Buffer.isBuffer(content) ? content : 
                    JSON.stringify(content);
        
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    
    countWords(content) {
        const text = typeof content === 'string' ? content : 
                    content.text || content.raw || JSON.stringify(content);
        
        return text.split(/\W+/).filter(word => word.length > 0).length;
    }
    
    countLines(content) {
        const text = typeof content === 'string' ? content : 
                    content.text || content.raw || JSON.stringify(content);
        
        return text.split('\n').length;
    }
    
    countCharacters(content) {
        const text = typeof content === 'string' ? content : 
                    content.text || content.raw || JSON.stringify(content);
        
        return text.length;
    }
    
    getProcessingStats() {
        return {
            totalProcessed: this.metadata.totalProcessed,
            totalSize: this.metadata.totalSize,
            totalSizeHuman: this.formatFileSize(this.metadata.totalSize),
            errors: this.metadata.errors,
            supportedFormats: this.supportedFormats
        };
    }
}

module.exports = DocReader;