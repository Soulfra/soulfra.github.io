
// audioRecorderWAV.js
export async function recordAudioWAV() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });

  const audioChunks = [];
  mediaRecorder.addEventListener('dataavailable', event => {
    audioChunks.push(event.data);
  });

  const start = () => mediaRecorder.start();
  const stop = () =>
    new Promise(resolve => {
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
      });
      mediaRecorder.stop();
    });

  return { start, stop };
}
