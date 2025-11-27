import { exec } from 'child_process';

export async function validateNodeDisk() {
  return new Promise((resolve, reject) => {
    exec('df -h /', (error, stdout, stderr) => {
      if (error) {
        return reject(new Error('❌ Could not read disk space.'));
      }
      const match = stdout.match(/(\d+)%/);
      if (match && parseInt(match[1]) > 80) {
        return reject(new Error('❌ Disk usage over 80%! Sacred node at risk.'));
      }
      console.log('✅ Disk usage safe.');
      resolve();
    });
  });
}