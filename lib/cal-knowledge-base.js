/**
 * Cal Knowledge Base
 *
 * SQLite-based knowledge storage for Cal's tutorial learnings.
 * Uses FTS5 for full-text search of concepts, tutorials, quiz results.
 *
 * Integration:
 *   const kb = new CalKnowledgeBase();
 *   await kb.init();
 *   await kb.storeLearning(tutorial);
 *   const results = await kb.search('connection pools');
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class CalKnowledgeBase {
  constructor(options = {}) {
    this.dbPath = options.dbPath || path.join(__dirname, '../data/cal-knowledge.db');
    this.db = null;
    this.verbose = options.verbose || false;
  }

  /**
   * Initialize database
   */
  async init() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          return reject(err);
        }

        this.createTables()
          .then(() => {
            if (this.verbose) {
              console.log(`💾 Cal Knowledge Base initialized: ${this.dbPath}`);
            }
            resolve();
          })
          .catch(reject);
      });
    });
  }

  /**
   * Create database tables
   */
  async createTables() {
    // Split SQL into individual statements for execution
    const statements = [
      // Main learnings table
      `CREATE TABLE IF NOT EXISTS learnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutorial_title TEXT NOT NULL,
        tutorial_description TEXT,
        learned_at TEXT NOT NULL,
        quiz_score INTEGER,
        quiz_total INTEGER,
        quiz_percentage REAL,
        file_path TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Concepts learned
      `CREATE TABLE IF NOT EXISTS concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL,
        concept_name TEXT NOT NULL,
        difficulty TEXT,
        FOREIGN KEY (learning_id) REFERENCES learnings(id) ON DELETE CASCADE
      )`,

      // Tutorial sections
      `CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL,
        section_title TEXT NOT NULL,
        section_content TEXT,
        section_order INTEGER,
        FOREIGN KEY (learning_id) REFERENCES learnings(id) ON DELETE CASCADE
      )`,

      // Code examples
      `CREATE TABLE IF NOT EXISTS examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        is_good BOOLEAN,
        is_bad BOOLEAN,
        comments TEXT,
        FOREIGN KEY (learning_id) REFERENCES learnings(id) ON DELETE CASCADE
      )`,

      // Analogies (learning aids)
      `CREATE TABLE IF NOT EXISTS analogies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL,
        analogy_title TEXT NOT NULL,
        analogy_description TEXT,
        FOREIGN KEY (learning_id) REFERENCES learnings(id) ON DELETE CASCADE
      )`,

      // Quiz questions and answers
      `CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        cal_answer TEXT,
        correct_answer TEXT,
        is_correct BOOLEAN,
        reasoning TEXT,
        FOREIGN KEY (learning_id) REFERENCES learnings(id) ON DELETE CASCADE
      )`,

      // Applications identified
      `CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL,
        system_name TEXT NOT NULL,
        change_description TEXT,
        file_path TEXT,
        pattern_name TEXT,
        FOREIGN KEY (learning_id) REFERENCES learnings(id) ON DELETE CASCADE
      )`,

      // Location mappings (physical locations → learning content)
      `CREATE TABLE IF NOT EXISTS location_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL,
        place_name TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        place_type TEXT,
        trigger_radius INTEGER DEFAULT 100,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (learning_id) REFERENCES learnings(id) ON DELETE CASCADE
      )`,

      // Tier progression (d2jsp-style leveling system)
      `CREATE TABLE IF NOT EXISTS tier_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        tier_level INTEGER NOT NULL DEFAULT 1,
        tier_name TEXT NOT NULL DEFAULT 'Novice',
        xp_earned INTEGER NOT NULL DEFAULT 0,
        xp_required INTEGER NOT NULL DEFAULT 100,
        quiz_scores_json TEXT,
        achievements_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Apple transactions (receipt validation logs)
      `CREATE TABLE IF NOT EXISTS apple_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        jws_renewal_info TEXT,
        jws_transaction TEXT,
        error_code TEXT,
        validation_status TEXT NOT NULL,
        subscription_status TEXT,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // FTS5 virtual table for full-text search
      `CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts USING fts5(
        tutorial_title,
        tutorial_description,
        concepts,
        content='learnings',
        content_rowid='id'
      )`,

      // Triggers to keep FTS5 in sync
      `CREATE TRIGGER IF NOT EXISTS learnings_ai AFTER INSERT ON learnings BEGIN
        INSERT INTO learnings_fts(rowid, tutorial_title, tutorial_description, concepts)
        VALUES (new.id, new.tutorial_title, new.tutorial_description, '');
      END`,

      `CREATE TRIGGER IF NOT EXISTS learnings_ad AFTER DELETE ON learnings BEGIN
        DELETE FROM learnings_fts WHERE rowid = old.id;
      END`,

      `CREATE TRIGGER IF NOT EXISTS learnings_au AFTER UPDATE ON learnings BEGIN
        UPDATE learnings_fts
        SET tutorial_title = new.tutorial_title,
            tutorial_description = new.tutorial_description
        WHERE rowid = new.id;
      END`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_concepts_learning ON concepts(learning_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sections_learning ON sections(learning_id)`,
      `CREATE INDEX IF NOT EXISTS idx_examples_learning ON examples(learning_id)`,
      `CREATE INDEX IF NOT EXISTS idx_analogies_learning ON analogies(learning_id)`,
      `CREATE INDEX IF NOT EXISTS idx_quiz_learning ON quiz_attempts(learning_id)`,
      `CREATE INDEX IF NOT EXISTS idx_applications_learning ON applications(learning_id)`,
      `CREATE INDEX IF NOT EXISTS idx_concepts_name ON concepts(concept_name)`,

      // Indexes for new integration tables
      `CREATE INDEX IF NOT EXISTS idx_location_mappings_learning ON location_mappings(learning_id)`,
      `CREATE INDEX IF NOT EXISTS idx_location_mappings_coords ON location_mappings(latitude, longitude)`,
      `CREATE INDEX IF NOT EXISTS idx_tier_progress_user ON tier_progress(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tier_progress_level ON tier_progress(tier_level)`,
      `CREATE INDEX IF NOT EXISTS idx_apple_transactions_user ON apple_transactions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_apple_transactions_txn ON apple_transactions(transaction_id)`
    ];

    // Execute statements sequentially
    for (const statement of statements) {
      await this.runSQL(statement);
    }
  }

  /**
   * Store a tutorial learning
   */
  async storeLearning(tutorial) {
    if (!tutorial || !tutorial.title) {
      throw new Error('Invalid tutorial object');
    }

    // Insert main learning record
    const learningId = await this.insertLearning(tutorial);

    // Insert related data
    await this.insertConcepts(learningId, tutorial.concepts || []);
    await this.insertSections(learningId, tutorial.sections || []);
    await this.insertExamples(learningId, tutorial.examples || []);
    await this.insertAnalogies(learningId, tutorial.analogies || []);

    // Insert quiz results if available
    if (tutorial.quizResults) {
      await this.insertQuizResults(learningId, tutorial.quizResults);
    }

    // Insert applications if available
    if (tutorial.applications) {
      await this.insertApplications(learningId, tutorial.applications);
    }

    // Update FTS5 with concepts
    await this.updateFTS5Concepts(learningId);

    if (this.verbose) {
      console.log(`✅ Stored learning: ${tutorial.title} (ID: ${learningId})`);
    }

    return learningId;
  }

  /**
   * Insert main learning record
   */
  async insertLearning(tutorial) {
    const sql = `
      INSERT INTO learnings (
        tutorial_title,
        tutorial_description,
        learned_at,
        quiz_score,
        quiz_total,
        quiz_percentage,
        file_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      tutorial.title,
      tutorial.description || '',
      new Date().toISOString().split('T')[0],
      tutorial.quizResults?.score || null,
      tutorial.quizResults?.total || null,
      tutorial.quizResults?.percentage || null,
      tutorial.filePath || null
    ];

    return this.runInsert(sql, params);
  }

  /**
   * Insert concepts
   */
  async insertConcepts(learningId, concepts) {
    if (!concepts || concepts.length === 0) return;

    const sql = `INSERT INTO concepts (learning_id, concept_name) VALUES (?, ?)`;

    for (const concept of concepts) {
      await this.runInsert(sql, [learningId, concept]);
    }
  }

  /**
   * Insert sections
   */
  async insertSections(learningId, sections) {
    if (!sections || sections.length === 0) return;

    const sql = `
      INSERT INTO sections (learning_id, section_title, section_content, section_order)
      VALUES (?, ?, ?, ?)
    `;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      await this.runInsert(sql, [
        learningId,
        section.title || '',
        section.content || '',
        i + 1
      ]);
    }
  }

  /**
   * Insert examples
   */
  async insertExamples(learningId, examples) {
    if (!examples || examples.length === 0) return;

    const sql = `
      INSERT INTO examples (learning_id, code, is_good, is_bad, comments)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const example of examples) {
      await this.runInsert(sql, [
        learningId,
        example.code || '',
        example.isGood ? 1 : 0,
        example.isBad ? 1 : 0,
        JSON.stringify(example.comments || [])
      ]);
    }
  }

  /**
   * Insert analogies
   */
  async insertAnalogies(learningId, analogies) {
    if (!analogies || analogies.length === 0) return;

    const sql = `
      INSERT INTO analogies (learning_id, analogy_title, analogy_description)
      VALUES (?, ?, ?)
    `;

    for (const analogy of analogies) {
      await this.runInsert(sql, [
        learningId,
        analogy.title || '',
        analogy.description || ''
      ]);
    }
  }

  /**
   * Insert quiz results
   */
  async insertQuizResults(learningId, quizResults) {
    if (!quizResults || !quizResults.answers) return;

    const sql = `
      INSERT INTO quiz_attempts (
        learning_id,
        question,
        cal_answer,
        correct_answer,
        is_correct,
        reasoning
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const answer of quizResults.answers) {
      await this.runInsert(sql, [
        learningId,
        answer.question || '',
        answer.calAnswer || '',
        answer.correctAnswer || '',
        answer.isCorrect ? 1 : 0,
        answer.reasoning || ''
      ]);
    }
  }

  /**
   * Insert applications
   */
  async insertApplications(learningId, applications) {
    if (!applications || applications.length === 0) return;

    const sql = `
      INSERT INTO applications (
        learning_id,
        system_name,
        change_description,
        file_path,
        pattern_name
      ) VALUES (?, ?, ?, ?, ?)
    `;

    for (const app of applications) {
      await this.runInsert(sql, [
        learningId,
        app.system || '',
        app.change || '',
        app.file || '',
        app.pattern || ''
      ]);
    }
  }

  /**
   * Update FTS5 with concepts
   */
  async updateFTS5Concepts(learningId) {
    // Get concepts for this learning
    const concepts = await this.querySQL(
      'SELECT concept_name FROM concepts WHERE learning_id = ?',
      [learningId]
    );

    const conceptsStr = concepts.map(c => c.concept_name).join(', ');

    // FTS5 doesn't support UPDATE, use DELETE + INSERT
    await this.runSQL('DELETE FROM learnings_fts WHERE rowid = ?', [learningId]);

    // Get tutorial data for re-insertion
    const learning = await this.querySQL(
      'SELECT tutorial_title, tutorial_description FROM learnings WHERE id = ?',
      [learningId]
    );

    if (learning && learning.length > 0) {
      await this.runSQL(
        'INSERT INTO learnings_fts(rowid, tutorial_title, tutorial_description, concepts) VALUES (?, ?, ?, ?)',
        [learningId, learning[0].tutorial_title, learning[0].tutorial_description, conceptsStr]
      );
    }
  }

  /**
   * Search knowledge base
   */
  async search(query, options = {}) {
    const limit = options.limit || 10;
    const conceptFilter = options.concept || null;

    let sql = `
      SELECT
        l.id,
        l.tutorial_title,
        l.tutorial_description,
        l.learned_at,
        l.quiz_score,
        l.quiz_total,
        l.quiz_percentage,
        GROUP_CONCAT(DISTINCT c.concept_name) as concepts
      FROM learnings l
      LEFT JOIN concepts c ON c.learning_id = l.id
    `;

    const params = [];
    const whereClauses = [];

    if (query && query.trim()) {
      whereClauses.push(`l.id IN (
        SELECT rowid FROM learnings_fts WHERE learnings_fts MATCH ?
      )`);
      params.push(query);
    }

    if (conceptFilter) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM concepts WHERE learning_id = l.id AND concept_name = ?
      )`);
      params.push(conceptFilter);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += `
      GROUP BY l.id
      ORDER BY l.created_at DESC
      LIMIT ?
    `;
    params.push(limit);

    return this.querySQL(sql, params);
  }

  /**
   * Get learning by ID
   */
  async getLearning(learningId) {
    const learning = await this.querySQL(
      'SELECT * FROM learnings WHERE id = ?',
      [learningId]
    );

    if (!learning || learning.length === 0) {
      return null;
    }

    const result = learning[0];

    // Get related data
    result.concepts = await this.querySQL(
      'SELECT concept_name, difficulty FROM concepts WHERE learning_id = ?',
      [learningId]
    );

    result.sections = await this.querySQL(
      'SELECT section_title, section_content FROM sections WHERE learning_id = ? ORDER BY section_order',
      [learningId]
    );

    result.examples = await this.querySQL(
      'SELECT code, is_good, is_bad, comments FROM examples WHERE learning_id = ?',
      [learningId]
    );

    result.analogies = await this.querySQL(
      'SELECT analogy_title, analogy_description FROM analogies WHERE learning_id = ?',
      [learningId]
    );

    result.quiz_attempts = await this.querySQL(
      'SELECT question, cal_answer, correct_answer, is_correct, reasoning FROM quiz_attempts WHERE learning_id = ?',
      [learningId]
    );

    result.applications = await this.querySQL(
      'SELECT system_name, change_description, file_path, pattern_name FROM applications WHERE learning_id = ?',
      [learningId]
    );

    return result;
  }

  /**
   * Get all concepts Cal has learned
   */
  async getAllConcepts() {
    return this.querySQL(`
      SELECT
        concept_name,
        COUNT(*) as occurrences,
        GROUP_CONCAT(DISTINCT difficulty) as difficulties
      FROM concepts
      GROUP BY concept_name
      ORDER BY occurrences DESC
    `);
  }

  /**
   * Get Cal's quiz performance
   */
  async getQuizPerformance() {
    return this.querySQL(`
      SELECT
        l.tutorial_title,
        l.quiz_score,
        l.quiz_total,
        l.quiz_percentage,
        l.learned_at,
        COUNT(q.id) as total_questions,
        SUM(CASE WHEN q.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
      FROM learnings l
      LEFT JOIN quiz_attempts q ON q.learning_id = l.id
      WHERE l.quiz_total IS NOT NULL
      GROUP BY l.id
      ORDER BY l.learned_at DESC
    `);
  }

  /**
   * Get applications Cal has identified
   */
  async getApplications() {
    return this.querySQL(`
      SELECT
        l.tutorial_title,
        a.system_name,
        a.change_description,
        a.file_path,
        a.pattern_name,
        l.learned_at
      FROM applications a
      JOIN learnings l ON l.id = a.learning_id
      ORDER BY l.learned_at DESC
    `);
  }

  /**
   * Get Cal's learning statistics
   */
  async getStats() {
    const totalLearnings = await this.querySQL(
      'SELECT COUNT(*) as count FROM learnings'
    );

    const totalConcepts = await this.querySQL(
      'SELECT COUNT(DISTINCT concept_name) as count FROM concepts'
    );

    const avgQuizScore = await this.querySQL(
      'SELECT AVG(quiz_percentage) as avg FROM learnings WHERE quiz_percentage IS NOT NULL'
    );

    const totalApplications = await this.querySQL(
      'SELECT COUNT(*) as count FROM applications'
    );

    const recentLearnings = await this.querySQL(
      `SELECT tutorial_title, learned_at FROM learnings ORDER BY created_at DESC LIMIT 5`
    );

    return {
      total_learnings: totalLearnings[0].count,
      total_concepts: totalConcepts[0].count,
      avg_quiz_score: avgQuizScore[0].avg || 0,
      total_applications: totalApplications[0].count,
      recent_learnings: recentLearnings
    };
  }

  /**
   * Helper: Run SQL that doesn't return rows
   */
  runSQL(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  /**
   * Helper: Run INSERT and return last ID
   */
  runInsert(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }

  /**
   * Helper: Run SELECT query
   */
  querySQL(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Close database
   */
  close() {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();

      this.db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

module.exports = CalKnowledgeBase;

// CLI usage example
if (require.main === module) {
  (async () => {
    const kb = new CalKnowledgeBase({ verbose: true });
    await kb.init();

    console.log('\n📊 Cal Knowledge Base Stats:\n');
    const stats = await kb.getStats();
    console.log(`Total Learnings: ${stats.total_learnings}`);
    console.log(`Total Concepts: ${stats.total_concepts}`);
    console.log(`Avg Quiz Score: ${stats.avg_quiz_score.toFixed(1)}%`);
    console.log(`Applications Identified: ${stats.total_applications}`);

    console.log('\n📚 Recent Learnings:');
    stats.recent_learnings.forEach(learning => {
      console.log(`  - ${learning.tutorial_title} (${learning.learned_at})`);
    });

    console.log('\n🔍 All Concepts:');
    const concepts = await kb.getAllConcepts();
    concepts.slice(0, 10).forEach(concept => {
      console.log(`  - ${concept.concept_name} (${concept.occurrences} tutorials)`);
    });

    await kb.close();
  })();
}
