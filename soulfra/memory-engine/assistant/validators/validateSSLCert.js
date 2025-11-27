import tls from 'tls';

export async function validateSSLCert() {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, 'your-whisper-node-domain.com', { servername: 'your-whisper-node-domain.com' }, () => {
      const cert = socket.getPeerCertificate();
      if (cert && cert.valid_to) {
        console.log(`✅ SSL Cert valid until: ${cert.valid_to}`);
        resolve();
      } else {
        reject(new Error('❌ SSL Certificate invalid or missing.'));
      }
      socket.end();
    });
    socket.on('error', reject);
  });
}