// debug-soulprints.js - API to fetch soulprints
import supabase from '../../helpers/supabaseClient';

export default async function handler(req, res) {
    const { data, error } = await supabase.from('soulprints').select('*');
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(200).json(data);
}
