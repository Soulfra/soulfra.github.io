export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/app2NkPC5K0JngQtj/trait_logs?filterByFormula=%7Buser_id%7D='${user_id}'`, {
      method: "GET",
      headers: {
        Authorization: "Bearer patxca1e9Y6FD5fq8.039f40e0b1e66be32518c56f37c87ad5c10bfe7c7e8a5f7167143530fb3cd09d",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch traits", details: data });
    }

    let total = 0;
    data.records.forEach(record => {
      const value = parseFloat(record.fields.value || 0);
      total += value;
    });

    return res.status(200).json({ soulpoints: Math.round(total * 100) });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}