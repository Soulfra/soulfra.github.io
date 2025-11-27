export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, source, timestamp } = req.body;

  if (!email || !source || !timestamp) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.airtable.com/v0/app2NkPC5K0JngQtj/leads", {
      method: "POST",
      headers: {
        Authorization: "Bearer patxca1e9Y6FD5fq8.039f40e0b1e66be32518c56f37c87ad5c10bfe7c7e8a5f7167143530fb3cd09d",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              email,
              source,
              timestamp
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Airtable error:", text);
      return res.status(500).json({ error: "Airtable request failed", details: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}