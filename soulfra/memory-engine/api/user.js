// Placeholder GET user API (optional)
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Future: fetch user's soulprint or memory history
    return res.status(200).json({ message: 'User fetch endpoint stub' });
}
