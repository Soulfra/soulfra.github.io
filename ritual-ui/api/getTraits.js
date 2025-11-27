export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  const formula = `AND({user_id}='${user_id}')`;
  const encodedFormula = encodeURIComponent(formula);

  try {
    const response = await fetch(`https://api.airtable.com/v0/app2NkPC5K0JngQtj/trait_logs?filterByFormula=${encodedFormula}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Airtable fetch error:", data);
      return res.status(500).json({ error: "Failed to fetch traits", details: data });
    }

    return res.status(200).json({ traits: data.records });
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}