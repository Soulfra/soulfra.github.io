import os from 'os';

export async function validateNodeCPU() {
  const load = os.loadavg()[0]; // 1-minute CPU load
  const cpus = os.cpus().length;
  if (load > cpus * 0.7) {
    throw new Error('❌ CPU load critically high.');
  }
  console.log('✅ CPU load normal.');
}