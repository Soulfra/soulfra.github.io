import { exec } from 'child_process';

export function validateWhisper() {
  exec(`${process.env.WHISPER_CLI_PATH} --help`, (error, stdout) => {
    if (error) {
      console.error('❌ Whisper CLI not executable.');
    } else {
      console.log('✅ Whisper CLI accessible.');
    }
  });
}