import { exec } from 'child_process';

export async function validateDockerContainers() {
  return new Promise((resolve, reject) => {
    exec('docker ps --format "{{.Names}}"', (error, stdout, stderr) => {
      if (error) {
        return reject(new Error('❌ Docker not running or no containers available.'));
      }
      const containers = stdout.split('\n').filter(Boolean);
      if (containers.length === 0) {
        return reject(new Error('❌ No active Docker containers.'));
      }
      console.log(`✅ Docker Containers Running: ${containers.join(', ')}`);
      resolve();
    });
  });
}