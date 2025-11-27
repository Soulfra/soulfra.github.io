import scheduleDecay from '../../helpers/scheduleDecay.js';
import decayScheduler from '../services/decayScheduler.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    scheduleDecay();
    const decayResult = await decayScheduler();

    return res.status(200).json({ message: 'Decay triggered', decayResult });
}
