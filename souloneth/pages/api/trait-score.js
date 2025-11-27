// pages/api/trait-score.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ritual_name, input_text } = req.body;

  // Very basic keyword-based trait scorer
  const traits = {};

  if (input_text.toLowerCase().includes('sorry') || input_text.toLowerCase().includes('regret')) {
    traits.vulnerability = true;
  }
  if (input_text.toLowerCase().includes('hope') || input_text.toLowerCase().includes('future')) {
    traits.hope = true;
  }
  if (input_text.toLowerCase().includes('lol') || input_text.toLowerCase().includes('laugh')) {
    traits.humor = true;
  }
  if (input_text.toLowerCase().includes('anxiety') || input_text.toLowerCase().includes('fear')) {
    traits.anxiety = true;
  }
  if (input_text.toLowerCase().includes('love') || input_text.toLowerCase().includes('forgive')) {
    traits.love = true;
  }
  if (input_text.toLowerCase().includes('lost') || input_text.toLowerCase().includes('grief')) {
    traits.grief = true;
  }

  console.log('Traits scored:', traits);

  return res.status(200).json({ traits });
}
