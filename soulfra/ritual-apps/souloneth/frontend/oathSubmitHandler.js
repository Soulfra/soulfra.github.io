// oathSubmitHandler.js
import postMemory from '../../../helpers/postMemory';
import generateMemoryId from '../../../helpers/generateMemoryId';
import formatTimestamp from '../../../helpers/formatTimestamp';

async function uploadAudioForTranscription(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'oathRecording.wav');

    const response = await fetch(process.env.NEXT_PUBLIC_TRANSCRIPTION_ENDPOINT, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        console.error('Transcription failed');
        throw new Error('Transcription upload failed.');
    }

    const data = await response.json();
    return data.transcribed_text;
}

async function oathSubmitHandler(audioBlob, userId) {
    try {
        // 1. Upload audio to Whisper server and get transcription
        const transcribedText = await uploadAudioForTranscription(audioBlob);

        if (!transcribedText) {
            console.error('No transcription received.');
            return;
        }

        // 2. Post the transcribed memory to Soulfra Memory Engine
        const memoryPayload = {
            memory_id: generateMemoryId(userId),
            user_id: userId,
            ritual_id: 'souloneth_oath_001',
            timestamp: formatTimestamp(),
            input_text: transcribedText,
            traits_detected: {}, // Traits will be filled after scoring
            emotional_snapshot: {}
        };

        const memoryPostResult = await postMemory(memoryPayload);

        if (!memoryPostResult) {
            console.error('Memory post failed.');
            return;
        }

        // 3. Immediately trigger trait scoring
        const traitScoreResponse = await fetch('/api/trait-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ritual_name: 'souloneth',
                input_text: transcribedText
            })
        });

        if (!traitScoreResponse.ok) {
            console.error('Trait scoring failed.');
            return;
        }

        const traitData = await traitScoreResponse.json();
        const traitsDetected = traitData.traits;

        // 4. Immediately update soulprint
        const soulprintUpdateResponse = await fetch('/api/soulprint', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                trait_deltas: Object.keys(traitsDetected).reduce((acc, trait) => {
                    acc[trait] = 1; // +1 for each detected trait
                    return acc;
                }, {})
            })
        });

        if (!soulprintUpdateResponse.ok) {
            console.error('Soulprint update failed.');
            return;
        }

        console.log('Oath fully processed successfully.');
    } catch (error) {
        console.error('Oath submission error:', error.message);
    }
}

export default oathSubmitHandler;
