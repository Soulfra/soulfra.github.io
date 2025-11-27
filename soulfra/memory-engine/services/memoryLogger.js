// memoryLogger.js
import supabase from '../../helpers/supabaseClient';

async function memoryLogger(memoryPayload) {
    const { data, error } = await supabase
        .from('memories')
        .insert([
            {
                user_id: memoryPayload.user_id,
                ritual_id: memoryPayload.ritual_id,
                input_text: memoryPayload.input_text,
                traits_detected: memoryPayload.traits_detected,
                timestamp: memoryPayload.timestamp
            }
        ]);

    if (error) {
        console.error('Error saving memory:', error.message);
        throw new Error(error.message);
    }

    console.log('Memory saved with Supabase:', data);
    return data;
}

export default memoryLogger;
