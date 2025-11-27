const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const router = express.Router();
const client = new textToSpeech.TextToSpeechClient();

router.post('/generate', async (req, res) => {
  const { text } = req.body;
  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    const filePath = '/tmp/output.mp3';
    await writeFile(filePath, response.audioContent, 'binary');
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
