#!/usr/bin/env node

/**
 * Knowledge Graph Ingestion Script
 *
 * Parses all docs/ files and extracts:
 * - Concepts (from titles, headers)
 * - Word frequencies (content analysis)
 * - Timestamps (file modification dates)
 * - Connections (cross-references between docs)
 *
 * Outputs: knowledge-graph.json
 *
 * Usage: node scripts/ingest-knowledge-graph.js
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(__dirname, '../knowledge-graph.json');

// Stop words for word frequency analysis
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'is', 'was', 'are', 'been', 'has', 'had', 'were', 'can', 'what'
]);

class KnowledgeGraphBuilder {
  constructor() {
    this.graph = {
      metadata: {
        created: new Date().toISOString(),
        totalDocs: 0,
        totalWords: 0,
        totalConcepts: 0
      },
      documents: [],
      concepts: {},
      wordFrequency: {},
      connections: [],
      timeline: []
    };
  }

  /**
   * Recursively get all files in docs directory
   */
  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.getAllFiles(filePath, fileList);
      } else if (file.endsWith('.md') || file.endsWith('.txt')) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  /**
   * Extract concepts from text (title-cased phrases, capitalized words)
   */
  extractConcepts(text, filename) {
    const concepts = new Set();

    // Extract from filename
    const filenameConcepts = filename
      .replace(/[-_]/g, ' ')
      .replace(/\.(md|txt)$/, '')
      .split(' ')
      .filter(word => word.length > 3 && /^[A-Z]/.test(word));

    filenameConcepts.forEach(c => concepts.add(c));

    // Extract headers (markdown # headings)
    const headerMatches = text.match(/^#+\s+(.+)$/gm) || [];
    headerMatches.forEach(header => {
      const cleaned = header.replace(/^#+\s+/, '').trim();
      if (cleaned.length > 3) concepts.add(cleaned);
    });

    // Extract capitalized phrases (2-4 words starting with capital)
    const phraseMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g) || [];
    phraseMatches.forEach(phrase => {
      if (phrase.length > 5 && !phrase.match(/^(The|This|That|These|Those)\b/)) {
        concepts.add(phrase);
      }
    });

    return Array.from(concepts);
  }

  /**
   * Count word frequencies (excluding stop words)
   */
  countWords(text) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !STOP_WORDS.has(word));

    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return frequency;
  }

  /**
   * Find connections between documents (shared concepts/references)
   */
  findConnections(doc, allDocs) {
    const connections = [];

    allDocs.forEach(otherDoc => {
      if (doc.id === otherDoc.id) return;

      // Find shared concepts
      const sharedConcepts = doc.concepts.filter(c =>
        otherDoc.concepts.includes(c)
      );

      if (sharedConcepts.length > 0) {
        connections.push({
          fromDoc: doc.id,
          toDoc: otherDoc.id,
          sharedConcepts: sharedConcepts,
          strength: sharedConcepts.length
        });
      }

      // Find direct references (one doc mentions the other's filename)
      const filename = path.basename(otherDoc.path, path.extname(otherDoc.path));
      if (doc.content.includes(filename)) {
        connections.push({
          fromDoc: doc.id,
          toDoc: otherDoc.id,
          type: 'reference',
          strength: 5 // References are stronger than shared concepts
        });
      }
    });

    return connections;
  }

  /**
   * Process a single document
   */
  processDocument(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const relativePath = path.relative(DOCS_DIR, filePath);

    const doc = {
      id: `doc-${this.graph.documents.length}`,
      path: relativePath,
      filename: filename,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
      concepts: this.extractConcepts(content, filename),
      wordCount: content.split(/\s+/).length,
      content: content.substring(0, 500) // First 500 chars for preview
    };

    // Update word frequencies
    const wordFreq = this.countWords(content);
    Object.entries(wordFreq).forEach(([word, count]) => {
      this.graph.wordFrequency[word] = (this.graph.wordFrequency[word] || 0) + count;
    });

    // Update concept index
    doc.concepts.forEach(concept => {
      if (!this.graph.concepts[concept]) {
        this.graph.concepts[concept] = {
          name: concept,
          documents: [],
          count: 0
        };
      }
      this.graph.concepts[concept].documents.push(doc.id);
      this.graph.concepts[concept].count++;
    });

    // Add to timeline
    this.graph.timeline.push({
      date: doc.modified,
      document: doc.id,
      filename: doc.filename
    });

    this.graph.totalWords += doc.wordCount;

    return doc;
  }

  /**
   * Build the knowledge graph
   */
  async build() {
    console.log('🔍 Scanning docs directory...');
    const files = this.getAllFiles(DOCS_DIR);

    console.log(`📚 Found ${files.length} documents to process`);

    // Process all documents
    console.log('⚙️  Processing documents...');
    files.forEach((file, index) => {
      if (index % 100 === 0) {
        console.log(`   Progress: ${index}/${files.length}`);
      }
      const doc = this.processDocument(file);
      this.graph.documents.push(doc);
    });

    console.log('🔗 Finding connections between documents...');
    // Find connections (only for first 500 docs to avoid n^2 explosion)
    const docsToConnect = this.graph.documents.slice(0, 500);
    docsToConnect.forEach((doc, index) => {
      if (index % 50 === 0) {
        console.log(`   Progress: ${index}/500`);
      }
      const connections = this.findConnections(doc, docsToConnect);
      this.graph.connections.push(...connections);
    });

    // Sort timeline
    this.graph.timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Sort word frequencies (top 500)
    const sortedWords = Object.entries(this.graph.wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 500);
    this.graph.wordFrequency = Object.fromEntries(sortedWords);

    // Update metadata
    this.graph.metadata.totalDocs = this.graph.documents.length;
    this.graph.metadata.totalConcepts = Object.keys(this.graph.concepts).length;

    console.log('\n📊 Knowledge Graph Summary:');
    console.log(`   Documents: ${this.graph.metadata.totalDocs}`);
    console.log(`   Concepts: ${this.graph.metadata.totalConcepts}`);
    console.log(`   Total Words: ${this.graph.metadata.totalWords.toLocaleString()}`);
    console.log(`   Connections: ${this.graph.connections.length}`);
    console.log(`   Timeline Span: ${this.graph.timeline[0]?.date || 'N/A'} → ${this.graph.timeline[this.graph.timeline.length - 1]?.date || 'N/A'}`);

    return this.graph;
  }

  /**
   * Save knowledge graph to JSON file
   */
  save() {
    console.log(`\n💾 Saving knowledge graph to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(this.graph, null, 2));
    console.log('✅ Knowledge graph saved!');

    const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
    console.log(`   File size: ${sizeKB} KB`);
  }
}

// Run the ingestion
async function main() {
  console.log('🚀 Starting Knowledge Graph Ingestion\n');

  const builder = new KnowledgeGraphBuilder();
  await builder.build();
  builder.save();

  console.log('\n🎉 Done! Knowledge graph is ready to use.');
  console.log('   Next steps:');
  console.log('   1. Use lib/knowledge-graph.js to query it');
  console.log('   2. Integrate with /cringeproof/ideas.html');
  console.log('   3. Build cross-domain router');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
