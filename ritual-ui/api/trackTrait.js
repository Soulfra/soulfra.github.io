export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, trait, value, ritual, timestamp } = req.body;

  if (!user_id || !trait || !value || !ritual || !timestamp) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.airtable.com/v0/app2NkPC5K0JngQtj/trait_logs", {
      method: "POST",
      headers: {
        Authorization: "Bearer patxca1e9Y6FD5fq8.039f40e0b1e66be32518c56f37c87ad5c10bfe7c7e8a5f7167143530fb3cd09d",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: [
          {
            fields: { user_id, trait, value, ritual, timestamp }
          }
        ]
      })
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to log trait", details: result });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}