/**
 * Cal Tutorial Reader
 *
 * Parses educational HTML files (/learn/*.html) so Cal can:
 * - Read tutorial content
 * - Take quizzes
 * - Learn concepts
 * - Apply knowledge to his own code
 *
 * Usage:
 *   const reader = new CalTutorialReader();
 *   const tutorial = await reader.read('/learn/pools-101.html');
 *   const quizResults = await reader.takeQuiz(tutorial.quiz);
 *   await reader.storeKnowledge(tutorial.concepts);
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // HTML parser (install with: npm install cheerio)
const CalKnowledgeBase = require('./cal-knowledge-base');

class CalTutorialReader {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.knowledgeBase = options.knowledgeBase || path.join(__dirname, '../data/cal-knowledge-base.md');
    this.calKB = new CalKnowledgeBase({ verbose: this.verbose });
    this.kbInitialized = false;
  }

  /**
   * Initialize Cal Knowledge Base
   */
  async initKB() {
    if (!this.kbInitialized) {
      await this.calKB.init();
      this.kbInitialized = true;
    }
  }

  /**
   * Read and parse a tutorial HTML file
   */
  async read(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Tutorial not found: ${filePath}`);
    }

    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    const tutorial = {
      title: this.extractTitle($),
      description: this.extractDescription($),
      concepts: this.extractConcepts($),
      sections: this.extractSections($),
      quiz: this.extractQuiz($),
      examples: this.extractExamples($),
      analogies: this.extractAnalogies($)
    };

    if (this.verbose) {
      console.log(`📚 Read tutorial: ${tutorial.title}`);
      console.log(`   Concepts: ${tutorial.concepts.length}`);
      console.log(`   Sections: ${tutorial.sections.length}`);
      console.log(`   Quiz questions: ${tutorial.quiz.length}`);
    }

    return tutorial;
  }

  /**
   * Extract tutorial title
   */
  extractTitle($) {
    const h1 = $('.header h1').text().trim();
    return h1 || $('title').text().trim();
  }

  /**
   * Extract description/tagline
   */
  extractDescription($) {
    return $('.header p').text().trim();
  }

  /**
   * Extract key concepts from tutorial
   */
  extractConcepts($) {
    const concepts = [];

    // Look for concept IDs in breadcrumbs or headers
    const breadcrumb = $('.breadcrumb').text();
    if (breadcrumb.includes('pools')) {
      concepts.push('connection-pools', 'resource-pooling', 'object-reuse');
    }

    // Extract from section headers
    $('.section h2, .section h3').each((i, elem) => {
      const heading = $(elem).text().trim();

      // Map headings to concepts
      if (heading.includes('Pool') || heading.includes('pool')) {
        concepts.push('pooling');
      }
      if (heading.includes('Thread')) {
        concepts.push('threading', 'concurrency');
      }
      if (heading.includes('Memory')) {
        concepts.push('memory-management', 'garbage-collection');
      }
      if (heading.includes('Connection')) {
        concepts.push('connection-management');
      }
    });

    return [...new Set(concepts)]; // Deduplicate
  }

  /**
   * Extract tutorial sections
   */
  extractSections($) {
    const sections = [];

    $('.section').each((i, elem) => {
      const section = {
        title: $(elem).find('h2').first().text().trim(),
        content: $(elem).find('p').map((j, p) => $(p).text().trim()).get().join('\n\n'),
        codeBlocks: $(elem).find('.code-block').map((j, code) => {
          return {
            code: $(code).text().trim(),
            language: 'javascript' // Default, could be extracted from class
          };
        }).get()
      };

      sections.push(section);
    });

    return sections;
  }

  /**
   * Extract quiz questions and answers
   */
  extractQuiz($) {
    const quiz = [];

    $('.quiz-question').each((i, elem) => {
      const questionText = $(elem).find('p strong').text().trim();
      const options = [];
      let correctAnswer = null;

      $(elem).find('.quiz-options li').each((j, option) => {
        const optionText = $(option).text().trim();
        const onClick = $(option).attr('onclick') || '';

        // Check if this is the correct answer (contains "true" in onclick)
        const isCorrect = onClick.includes('true');

        options.push({
          text: optionText,
          isCorrect: isCorrect
        });

        if (isCorrect) {
          correctAnswer = optionText;
        }
      });

      quiz.push({
        question: questionText,
        options: options,
        correctAnswer: correctAnswer
      });
    });

    return quiz;
  }

  /**
   * Extract code examples
   */
  extractExamples($) {
    const examples = [];

    $('.code-block').each((i, elem) => {
      const code = $(elem).text().trim();
      const comments = code.match(/\/\/.*$/gm) || [];

      examples.push({
        code: code,
        comments: comments,
        isBad: code.includes('❌') || code.includes('BAD'),
        isGood: code.includes('✅') || code.includes('GOOD')
      });
    });

    return examples;
  }

  /**
   * Extract analogies (learning aids)
   */
  extractAnalogies($) {
    const analogies = [];

    $('.analogy').each((i, elem) => {
      analogies.push({
        title: $(elem).find('h4').text().trim(),
        description: $(elem).find('p').map((j, p) => $(p).text().trim()).get().join('\n')
      });
    });

    return analogies;
  }

  /**
   * Take quiz and score Cal's answers
   * Cal uses pattern matching to answer questions
   */
  async takeQuiz(quiz) {
    const results = {
      score: 0,
      total: quiz.length,
      answers: []
    };

    for (const question of quiz) {
      const calAnswer = this.answerQuestion(question);
      const isCorrect = calAnswer.text === question.correctAnswer;

      if (isCorrect) {
        results.score++;
      }

      results.answers.push({
        question: question.question,
        calAnswer: calAnswer.text,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        reasoning: calAnswer.reasoning
      });
    }

    results.percentage = (results.score / results.total) * 100;

    if (this.verbose) {
      console.log(`\n📝 Quiz Results: ${results.score}/${results.total} (${results.percentage.toFixed(0)}%)`);
      results.answers.forEach((answer, i) => {
        const icon = answer.isCorrect ? '✅' : '❌';
        console.log(`${icon} Q${i + 1}: ${answer.calAnswer.substring(0, 50)}...`);
      });
    }

    return results;
  }

  /**
   * Cal's quiz-taking logic (pattern matching)
   */
  answerQuestion(question) {
    const q = question.question.toLowerCase();
    const options = question.options;

    // Pattern matching for common concepts
    if (q.includes('pool') && q.includes('faster')) {
      // "Why are pools faster?"
      const answer = options.find(opt => opt.text.toLowerCase().includes('reuse'));
      if (answer) {
        return {
          text: answer.text,
          reasoning: 'Pools reuse resources instead of creating new ones - matches pool concept'
        };
      }
    }

    if (q.includes('max') && q.includes('requests')) {
      // "What happens when pool is at max?"
      const answer = options.find(opt => opt.text.toLowerCase().includes('wait') || opt.text.toLowerCase().includes('timeout'));
      if (answer) {
        return {
          text: answer.text,
          reasoning: 'Bounded pools cause requests to wait when exhausted'
        };
      }
    }

    if (q.includes('thread pool') && q.includes('size')) {
      // "What's optimal thread pool size?"
      const answer = options.find(opt => opt.text.toLowerCase().includes('cpu') || opt.text.toLowerCase().includes('core'));
      if (answer) {
        return {
          text: answer.text,
          reasoning: 'Thread pool size should match CPU core count for CPU-bound tasks'
        };
      }
    }

    if (q.includes('object pool')) {
      // "When to use object pooling?"
      const answer = options.find(opt => opt.text.toLowerCase().includes('expensive') || opt.text.toLowerCase().includes('short-lived'));
      if (answer) {
        return {
          text: answer.text,
          reasoning: 'Object pools are for expensive-to-create, short-lived objects'
        };
      }
    }

    // Fallback: Pick first option
    return {
      text: options[0].text,
      reasoning: 'No pattern match found, guessing first option'
    };
  }

  /**
   * Store learned concepts in Cal's knowledge base
   */
  async storeKnowledge(tutorial) {
    // Initialize KB if needed
    await this.initKB();

    // Store in SQLite database for queryable RAG
    const learningId = await this.calKB.storeLearning(tutorial);

    // Also store in markdown format (human-readable)
    const knowledge = this.formatKnowledge(tutorial);

    // Append to markdown knowledge base
    if (!fs.existsSync(path.dirname(this.knowledgeBase))) {
      fs.mkdirSync(path.dirname(this.knowledgeBase), { recursive: true });
    }

    const existingKB = fs.existsSync(this.knowledgeBase)
      ? fs.readFileSync(this.knowledgeBase, 'utf-8')
      : '# Cal Knowledge Base\n\n';

    const updatedKB = existingKB + '\n\n' + knowledge;

    fs.writeFileSync(this.knowledgeBase, updatedKB);

    if (this.verbose) {
      console.log(`💾 Stored knowledge: ${tutorial.title}`);
      console.log(`   Database ID: ${learningId}`);
      console.log(`   Concepts: ${tutorial.concepts.join(', ')}`);
      console.log(`   Markdown file: ${this.knowledgeBase}`);
    }

    return {
      success: true,
      learningId: learningId,
      file: this.knowledgeBase,
      database: this.calKB.dbPath
    };
  }

  /**
   * Format tutorial as knowledge base entry
   */
  formatKnowledge(tutorial) {
    const timestamp = new Date().toISOString().split('T')[0];

    let md = `## ${tutorial.title}\n`;
    md += `**Learned:** ${timestamp}\n\n`;
    md += `**Description:** ${tutorial.description}\n\n`;
    md += `**Key Concepts:**\n`;
    tutorial.concepts.forEach(concept => {
      md += `- ${concept}\n`;
    });

    md += `\n**What I Learned:**\n`;
    tutorial.sections.forEach((section, i) => {
      if (i < 3) { // Only first 3 sections
        md += `\n### ${section.title}\n`;
        md += section.content.split('\n').slice(0, 2).join('\n') + '\n';
      }
    });

    md += `\n**Quiz Score:** ${tutorial.quizResults?.score || 0}/${tutorial.quizResults?.total || 0}\n`;

    md += `\n**Analogies:**\n`;
    tutorial.analogies.forEach(analogy => {
      md += `- **${analogy.title}:** ${analogy.description.split('\n')[0]}\n`;
    });

    return md;
  }

  /**
   * Apply learned concepts to Cal's decision-making
   */
  async applyToCal(tutorial) {
    // This method would integrate with Cal's existing systems:
    // - Update decision trees
    // - Modify API call patterns
    // - Restructure data flow based on learnings

    const applications = [];

    // Example: If Cal learned about connection pools
    if (tutorial.concepts.includes('connection-pools')) {
      applications.push({
        system: 'API Gateway',
        change: 'Use connection pool instead of creating connections per request',
        file: 'lib/api-gateway.js',
        pattern: 'connection pooling'
      });
    }

    // Example: If Cal learned about thread pools
    if (tutorial.concepts.includes('threading')) {
      applications.push({
        system: 'Worker System',
        change: 'Reuse worker threads instead of spawning per task',
        file: 'lib/worker-manager.js',
        pattern: 'thread pool executor'
      });
    }

    // Example: If Cal learned about object pools
    if (tutorial.concepts.includes('object-reuse')) {
      applications.push({
        system: 'Data Processing',
        change: 'Reuse temporary objects in loops to reduce GC pressure',
        file: 'lib/data-processor.js',
        pattern: 'object pooling'
      });
    }

    if (this.verbose) {
      console.log(`\n🔧 Applications to Cal's Systems:`);
      applications.forEach((app, i) => {
        console.log(`${i + 1}. ${app.system}: ${app.change}`);
        console.log(`   File: ${app.file}`);
      });
    }

    return applications;
  }
}

module.exports = CalTutorialReader;

// CLI usage
if (require.main === module) {
  const tutorialPath = process.argv[2] || path.join(__dirname, '../learn/pools-101.html');

  (async () => {
    console.log('🤖 Cal Tutorial Reader\n');

    const reader = new CalTutorialReader({ verbose: true });

    console.log(`📖 Reading tutorial: ${tutorialPath}\n`);
    const tutorial = await reader.read(tutorialPath);

    console.log(`\n📝 Taking quiz...`);
    const quizResults = await reader.takeQuiz(tutorial.quiz);
    tutorial.quizResults = quizResults;

    console.log(`\n💾 Storing knowledge...`);
    await reader.storeKnowledge(tutorial);

    console.log(`\n🔧 Identifying applications to Cal's systems...`);
    const applications = await reader.applyToCal(tutorial);

    console.log(`\n✅ Learning complete!`);
    console.log(`   Concepts learned: ${tutorial.concepts.length}`);
    console.log(`   Quiz score: ${quizResults.score}/${quizResults.total}`);
    console.log(`   Applications identified: ${applications.length}`);
  })();
}
