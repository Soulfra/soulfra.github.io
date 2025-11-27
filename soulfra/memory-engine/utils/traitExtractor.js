// /utils/traitExtractor.js

export async function extractTraitsFromTranscript(transcript) {
  console.log('🧠 Running fake trait extractor on transcript...');
  
  // FAKE: Return empty traits for now
  return {
    presence: Math.random() > 0.5 ? "strong" : "soft",
    tone: Math.random() > 0.5 ? "hopeful" : "reflective",
  };
}