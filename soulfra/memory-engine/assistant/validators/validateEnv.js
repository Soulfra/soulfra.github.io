import dotenv from 'dotenv';
dotenv.config();

export async function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'WHISPER_CLI_PATH', 'WHISPER_MODEL_PATH'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing .env keys: ${missing.join(', ')}`);
  }
  console.log('✅ .env validation passed.');
}