// Folder Parser - Builds structure tree from uploaded documents
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FolderParser {
    constructor() {
        this.folderTree = {};
        this.flatList = [];
        this.metadata = {
            totalFolders: 0,
            totalFiles: 0,
            totalSize: 0,
            maxDepth: 0,
            fileTypes: new Set(),
            largestFile: null,
            smallestFile: null
        };
    }
    
    async parseFolder(folderPath, includeHidden = false) {
        console.log(`📁 Parsing folder: ${folderPath}`);
        
        try {
            this.folderTree = await this.buildFolderTree(folderPath, '', 0, includeHidden);
            this.generateFlatList(this.folderTree);
            this.calculateMetadata();
            
            return {
                tree: this.folderTree,
                flat: this.flatList,
                metadata: this.metadata,
                summary: this.generateSummary()
            };
        } catch (error) {
            console.error(`❌ Error parsing folder: ${error.message}`);
            throw error;
        }
    }
    
    async buildFolderTree(currentPath, relativePath, depth, includeHidden) {
        const tree = {
            name: path.basename(currentPath) || '/',
            path: currentPath,
            relativePath: relativePath,
            type: 'folder',
            depth: depth,
            children: [],
            metadata: {
                created: null,
                modified: null,
                size: 0,
                fileCount: 0,
                folderCount: 0
            }
        };
        
        // Update max depth
        if (depth > this.metadata.maxDepth) {
            this.metadata.maxDepth = depth;
        }
        
        try {
            const items = await fs.readdir(currentPath);
            
            for (const item of items) {
                // Skip hidden files unless requested
                if (!includeHidden && item.startsWith('.')) {
                    continue;
                }
                
                const itemPath = path.join(currentPath, item);
                const itemRelativePath = path.join(relativePath, item);
                
                try {
                    const stats = await fs.stat(itemPath);
                    
                    if (stats.isDirectory()) {
                        // Recursively parse subdirectory
                        const subTree = await this.buildFolderTree(
                            itemPath, 
                            itemRelativePath, 
                            depth + 1, 
                            includeHidden
                        );
                        
                        tree.children.push(subTree);
                        tree.metadata.folderCount++;
                        tree.metadata.size += subTree.metadata.size;
                        
                        this.metadata.totalFolders++;
                        
                    } else if (stats.isFile()) {
                        // Add file to tree
                        const fileNode = {
                            name: item,
                            path: itemPath,
                            relativePath: itemRelativePath,
                            type: 'file',
                            depth: depth + 1,
                            extension: path.extname(item).toLowerCase(),
                            metadata: {
                                size: stats.size,
                                sizeHuman: this.formatFileSize(stats.size),
                                created: stats.birthtime,
                                modified: stats.mtime,
                                accessed: stats.atime,
                                permissions: this.parsePermissions(stats.mode),
                                hash: null // Will be computed on demand
                            }
                        };
                        
                        tree.children.push(fileNode);
                        tree.metadata.fileCount++;
                        tree.metadata.size += stats.size;
                        
                        // Update global metadata
                        this.metadata.totalFiles++;
                        this.metadata.totalSize += stats.size;
                        this.metadata.fileTypes.add(fileNode.extension || 'no-extension');
                        
                        // Track largest/smallest files
                        if (!this.metadata.largestFile || stats.size > this.metadata.largestFile.size) {
                            this.metadata.largestFile = {
                                path: itemRelativePath,
                                size: stats.size
                            };
                        }
                        
                        if (!this.metadata.smallestFile || stats.size < this.metadata.smallestFile.size) {
                            this.metadata.smallestFile = {
                                path: itemRelativePath,
                                size: stats.size
                            };
                        }
                    }
                    
                } catch (itemError) {
                    console.warn(`⚠️ Error processing ${itemPath}: ${itemError.message}`);
                    
                    // Add error node
                    tree.children.push({
                        name: item,
                        path: itemPath,
                        relativePath: itemRelativePath,
                        type: 'error',
                        error: itemError.message,
                        depth: depth + 1
                    });
                }
            }
            
            // Sort children: folders first, then files
            tree.children.sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
            
            // Update folder metadata
            const folderStats = await fs.stat(currentPath);
            tree.metadata.created = folderStats.birthtime;
            tree.metadata.modified = folderStats.mtime;
            
        } catch (error) {
            console.error(`❌ Error reading directory ${currentPath}: ${error.message}`);
            tree.error = error.message;
        }
        
        return tree;
    }
    
    generateFlatList(tree, parentPath = '') {
        if (tree.type === 'file') {
            this.flatList.push({
                name: tree.name,
                path: tree.path,
                relativePath: tree.relativePath,
                extension: tree.extension,
                size: tree.metadata.size,
                sizeHuman: tree.metadata.sizeHuman,
                created: tree.metadata.created,
                modified: tree.metadata.modified,
                parentPath: parentPath,
                depth: tree.depth
            });
        }
        
        if (tree.children) {
            for (const child of tree.children) {
                this.generateFlatList(child, tree.relativePath);
            }
        }
    }
    
    calculateMetadata() {
        // Convert file types Set to array
        this.metadata.fileTypes = Array.from(this.metadata.fileTypes);
        
        // Add human-readable sizes
        this.metadata.totalSizeHuman = this.formatFileSize(this.metadata.totalSize);
        
        if (this.metadata.largestFile) {
            this.metadata.largestFile.sizeHuman = this.formatFileSize(this.metadata.largestFile.size);
        }
        
        if (this.metadata.smallestFile) {
            this.metadata.smallestFile.sizeHuman = this.formatFileSize(this.metadata.smallestFile.size);
        }
        
        // Calculate average file size
        this.metadata.avgFileSize = this.metadata.totalFiles > 0 ? 
            Math.round(this.metadata.totalSize / this.metadata.totalFiles) : 0;
        this.metadata.avgFileSizeHuman = this.formatFileSize(this.metadata.avgFileSize);
        
        // Group files by extension
        this.metadata.fileTypeDistribution = this.getFileTypeDistribution();
    }
    
    getFileTypeDistribution() {
        const distribution = {};
        
        for (const file of this.flatList) {
            const ext = file.extension || 'no-extension';
            if (!distribution[ext]) {
                distribution[ext] = {
                    count: 0,
                    totalSize: 0,
                    files: []
                };
            }
            
            distribution[ext].count++;
            distribution[ext].totalSize += file.size;
            
            // Keep track of first 5 files of each type
            if (distribution[ext].files.length < 5) {
                distribution[ext].files.push(file.relativePath);
            }
        }
        
        // Add human-readable sizes
        for (const ext in distribution) {
            distribution[ext].totalSizeHuman = this.formatFileSize(distribution[ext].totalSize);
            distribution[ext].avgSize = Math.round(distribution[ext].totalSize / distribution[ext].count);
            distribution[ext].avgSizeHuman = this.formatFileSize(distribution[ext].avgSize);
        }
        
        return distribution;
    }
    
    generateSummary() {
        const topExtensions = Object.entries(this.metadata.fileTypeDistribution)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([ext, data]) => ({
                extension: ext,
                count: data.count,
                totalSize: data.totalSizeHuman
            }));
        
        return {
            overview: `${this.metadata.totalFiles} files in ${this.metadata.totalFolders} folders`,
            totalSize: this.metadata.totalSizeHuman,
            avgFileSize: this.metadata.avgFileSizeHuman,
            maxDepth: this.metadata.maxDepth,
            topFileTypes: topExtensions,
            largestFile: this.metadata.largestFile,
            smallestFile: this.metadata.smallestFile
        };
    }
    
    async generateStructureVisualization(tree = this.folderTree, prefix = '', isLast = true) {
        let visualization = '';
        
        // Add current node
        if (tree.name !== '/') {
            const connector = isLast ? '└── ' : '├── ';
            const icon = tree.type === 'folder' ? '📁' : this.getFileIcon(tree.extension);
            const size = tree.type === 'file' ? ` (${tree.metadata.sizeHuman})` : '';
            
            visualization += prefix + connector + icon + ' ' + tree.name + size + '\n';
        }
        
        // Process children
        if (tree.children) {
            const childPrefix = tree.name === '/' ? '' : prefix + (isLast ? '    ' : '│   ');
            
            for (let i = 0; i < tree.children.length; i++) {
                const child = tree.children[i];
                const isLastChild = i === tree.children.length - 1;
                
                visualization += await this.generateStructureVisualization(
                    child, 
                    childPrefix, 
                    isLastChild
                );
            }
        }
        
        return visualization;
    }
    
    getFileIcon(extension) {
        const iconMap = {
            '.pdf': '📄',
            '.txt': '📝',
            '.md': '📝',
            '.doc': '📃',
            '.docx': '📃',
            '.json': '🗂️',
            '.yaml': '🗂️',
            '.yml': '🗂️',
            '.csv': '📊',
            '.html': '🌐',
            '.htm': '🌐',
            '.xml': '📋',
            '.log': '📜',
            '.png': '🖼️',
            '.jpg': '🖼️',
            '.jpeg': '🖼️',
            '.gif': '🖼️',
            '.svg': '🖼️',
            '.mp4': '🎥',
            '.mp3': '🎵',
            '.zip': '🗜️',
            '.tar': '🗜️',
            '.gz': '🗜️'
        };
        
        return iconMap[extension] || '📎';
    }
    
    parsePermissions(mode) {
        // Parse Unix file permissions
        const permissions = {
            owner: {
                read: (mode & 0o400) !== 0,
                write: (mode & 0o200) !== 0,
                execute: (mode & 0o100) !== 0
            },
            group: {
                read: (mode & 0o040) !== 0,
                write: (mode & 0o020) !== 0,
                execute: (mode & 0o010) !== 0
            },
            others: {
                read: (mode & 0o004) !== 0,
                write: (mode & 0o002) !== 0,
                execute: (mode & 0o001) !== 0
            }
        };
        
        // Generate human-readable string
        const str = [
            permissions.owner.read ? 'r' : '-',
            permissions.owner.write ? 'w' : '-',
            permissions.owner.execute ? 'x' : '-',
            permissions.group.read ? 'r' : '-',
            permissions.group.write ? 'w' : '-',
            permissions.group.execute ? 'x' : '-',
            permissions.others.read ? 'r' : '-',
            permissions.others.write ? 'w' : '-',
            permissions.others.execute ? 'x' : '-'
        ].join('');
        
        return {
            numeric: mode.toString(8),
            string: str,
            object: permissions
        };
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
    }
    
    async searchFiles(query, options = {}) {
        const {
            caseSensitive = false,
            useRegex = false,
            searchInPath = true,
            searchInContent = false,
            maxResults = 100
        } = options;
        
        const results = [];
        const searchPattern = useRegex ? 
            new RegExp(query, caseSensitive ? '' : 'i') : 
            query.toLowerCase();
        
        for (const file of this.flatList) {
            if (results.length >= maxResults) break;
            
            let matches = false;
            
            // Search in file path/name
            if (searchInPath) {
                const target = caseSensitive ? file.relativePath : file.relativePath.toLowerCase();
                
                if (useRegex) {
                    matches = searchPattern.test(target);
                } else {
                    matches = target.includes(searchPattern);
                }
            }
            
            // Search in file content (if requested and supported)
            if (!matches && searchInContent && this.isTextFile(file.extension)) {
                try {
                    const content = await fs.readFile(file.path, 'utf8');
                    const target = caseSensitive ? content : content.toLowerCase();
                    
                    if (useRegex) {
                        matches = searchPattern.test(target);
                    } else {
                        matches = target.includes(searchPattern);
                    }
                    
                    if (matches) {
                        // Find matching lines
                        const lines = content.split('\n');
                        const matchingLines = [];
                        
                        lines.forEach((line, index) => {
                            const lineTarget = caseSensitive ? line : line.toLowerCase();
                            const lineMatches = useRegex ? 
                                searchPattern.test(lineTarget) : 
                                lineTarget.includes(searchPattern);
                            
                            if (lineMatches && matchingLines.length < 5) {
                                matchingLines.push({
                                    number: index + 1,
                                    content: line.trim().substring(0, 100)
                                });
                            }
                        });
                        
                        file.contentMatches = matchingLines;
                    }
                } catch (error) {
                    console.warn(`Could not search content of ${file.path}: ${error.message}`);
                }
            }
            
            if (matches) {
                results.push({
                    ...file,
                    matchType: searchInContent && file.contentMatches ? 'content' : 'path'
                });
            }
        }
        
        return {
            query: query,
            options: options,
            results: results,
            totalMatches: results.length,
            truncated: results.length === maxResults
        };
    }
    
    isTextFile(extension) {
        const textExtensions = [
            '.txt', '.md', '.json', '.yaml', '.yml', 
            '.csv', '.log', '.html', '.htm', '.xml',
            '.js', '.ts', '.jsx', '.tsx', '.css', '.scss',
            '.py', '.java', '.cpp', '.c', '.h', '.hpp',
            '.sh', '.bash', '.zsh', '.fish',
            '.env', '.ini', '.conf', '.config'
        ];
        
        return textExtensions.includes(extension);
    }
    
    getFilesByExtension(extension) {
        return this.flatList.filter(file => file.extension === extension);
    }
    
    getFilesBySize(minSize = 0, maxSize = Infinity) {
        return this.flatList.filter(file => file.size >= minSize && file.size <= maxSize);
    }
    
    getFilesByDate(startDate, endDate, dateField = 'modified') {
        return this.flatList.filter(file => {
            const fileDate = new Date(file[dateField]);
            return fileDate >= startDate && fileDate <= endDate;
        });
    }
    
    async generateHash(filePath) {
        try {
            const content = await fs.readFile(filePath);
            return crypto.createHash('sha256').update(content).digest('hex');
        } catch (error) {
            console.error(`Error generating hash for ${filePath}: ${error.message}`);
            return null;
        }
    }
    
    async detectDuplicates() {
        const hashMap = new Map();
        const duplicates = [];
        
        for (const file of this.flatList) {
            if (file.size > 0) { // Skip empty files
                const hash = await this.generateHash(file.path);
                
                if (hash) {
                    if (hashMap.has(hash)) {
                        const original = hashMap.get(hash);
                        duplicates.push({
                            original: original,
                            duplicate: file,
                            hash: hash
                        });
                    } else {
                        hashMap.set(hash, file);
                    }
                }
            }
        }
        
        return {
            totalDuplicates: duplicates.length,
            duplicates: duplicates,
            savedSpace: duplicates.reduce((sum, dup) => sum + dup.duplicate.size, 0)
        };
    }
}

module.exports = FolderParser;