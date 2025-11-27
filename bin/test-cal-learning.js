#!/usr/bin/env node

/**
 * Test Cal's Learning System
 *
 * Demonstrates:
 * 1. Cal reads tutorial HTML
 * 2. Cal takes quiz
 * 3. Cal stores knowledge in SQLite database
 * 4. Cal queries his knowledge base
 * 5. Cal applies concepts to his systems
 */

const path = require('path');
const CalTutorialReader = require('../lib/cal-tutorial-reader');
const CalKnowledgeBase = require('../lib/cal-knowledge-base');

(async () => {
  console.log('🧪 Testing Cal Learning System\n');

  // Initialize reader with verbose output
  const reader = new CalTutorialReader({ verbose: true });

  // Tutorial path (check if it exists)
  const tutorialPath = path.join(__dirname, '../learn/pools-101.html');

  console.log('📖 [1/5] Cal reads tutorial...\n');
  const tutorial = await reader.read(tutorialPath);

  console.log(`\n✅ Tutorial parsed:`);
  console.log(`   Title: ${tutorial.title}`);
  console.log(`   Concepts: ${tutorial.concepts.length}`);
  console.log(`   Sections: ${tutorial.sections.length}`);
  console.log(`   Quiz questions: ${tutorial.quiz.length}`);
  console.log(`   Examples: ${tutorial.examples.length}`);
  console.log(`   Analogies: ${tutorial.analogies.length}`);

  console.log('\n\n📝 [2/5] Cal takes quiz...\n');
  const quizResults = await reader.takeQuiz(tutorial.quiz);
  tutorial.quizResults = quizResults;

  console.log(`\n✅ Quiz complete:`);
  console.log(`   Score: ${quizResults.score}/${quizResults.total} (${quizResults.percentage.toFixed(0)}%)`);

  console.log('\n\n🔧 [3/5] Cal identifies applications...\n');
  const applications = await reader.applyToCal(tutorial);
  tutorial.applications = applications;

  console.log(`\n✅ Applications identified: ${applications.length}`);
  applications.forEach((app, i) => {
    console.log(`   ${i + 1}. ${app.system}: ${app.change}`);
  });

  console.log('\n\n💾 [4/5] Cal stores knowledge in database...\n');
  const storeResult = await reader.storeKnowledge(tutorial);

  console.log(`\n✅ Knowledge stored:`);
  console.log(`   Database ID: ${storeResult.learningId}`);
  console.log(`   Database path: ${storeResult.database}`);
  console.log(`   Markdown path: ${storeResult.file}`);

  console.log('\n\n🔍 [5/5] Cal queries his knowledge base...\n');

  // Direct access to knowledge base for querying
  const kb = new CalKnowledgeBase({ verbose: true });
  await kb.init();

  // Search for "connection pools"
  console.log('🔎 Searching for "connection pools"...\n');
  const searchResults = await kb.search('connection pools', { limit: 5 });

  if (searchResults.length > 0) {
    console.log(`✅ Found ${searchResults.length} results:`);
    searchResults.forEach((result, i) => {
      console.log(`\n   ${i + 1}. ${result.tutorial_title}`);
      console.log(`      Concepts: ${result.concepts || 'N/A'}`);
      console.log(`      Quiz score: ${result.quiz_score || 0}/${result.quiz_total || 0}`);
      console.log(`      Learned: ${result.learned_at}`);
    });
  } else {
    console.log('❌ No results found');
  }

  // Get Cal's stats
  console.log('\n\n📊 Cal\'s Learning Statistics:\n');
  const stats = await kb.getStats();

  console.log(`   Total tutorials learned: ${stats.total_learnings}`);
  console.log(`   Unique concepts mastered: ${stats.total_concepts}`);
  console.log(`   Average quiz score: ${stats.avg_quiz_score.toFixed(1)}%`);
  console.log(`   Applications identified: ${stats.total_applications}`);

  console.log('\n\n📚 Recent learnings:');
  stats.recent_learnings.forEach((learning, i) => {
    console.log(`   ${i + 1}. ${learning.tutorial_title} (${learning.learned_at})`);
  });

  // Get all concepts
  console.log('\n\n🎓 All concepts Cal has learned:');
  const concepts = await kb.getAllConcepts();

  concepts.slice(0, 10).forEach((concept, i) => {
    console.log(`   ${i + 1}. ${concept.concept_name} (${concept.occurrences} tutorial${concept.occurrences > 1 ? 's' : ''})`);
  });

  // Clean up
  await kb.close();

  console.log('\n\n✅ Test complete!');
  console.log('\n📖 Cal has successfully:');
  console.log('   1. Read and parsed tutorial HTML');
  console.log('   2. Taken quiz and scored results');
  console.log('   3. Identified system applications');
  console.log('   4. Stored knowledge in queryable database');
  console.log('   5. Retrieved knowledge using full-text search');

  console.log('\n🔗 Next steps:');
  console.log('   - Wire Cal\'s chat to query knowledge base');
  console.log('   - Apply learnings to API structure');
  console.log('   - Organize knowledge into decision trees');
})().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
