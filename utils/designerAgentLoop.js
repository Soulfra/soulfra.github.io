const fs = require("fs");
const path = require("path");
const { runArtRouter } = require("./runArtRouter");
const { runCodeRouter } = require("./runCodeRouter");
const { brandVoiceAgent } = require("./brandVoiceAgent");
const { runStyleAgent } = require("./runStyleAgent");

/**
 * Full design orchestration agent that calls art, voice, layout, and style generators,
 * then outputs assets into the /drops folder.
 *
 * @param {string} dropName - Name of the ritual/app (e.g. "NiceLeak")
 * @param {string} mood - Emotional tone (e.g. "chaotic", "playful")
 */
async function designerAgentLoop(dropName, mood = "neutral") {
  try {
    console.log(`🎨 Designing '${dropName}' with mood '${mood}'...`);

    const art = await runArtRouter({ dropName, mood });
    const voice = await brandVoiceAgent({ dropName, mood });
    const style = await runStyleAgent(mood);

    const layoutPrompt = `
      Generate an HTML+Tailwind layout for a Gen Z ritual app called '${dropName}'.
      Mood: ${mood}.
      Use visual cues like: ${art.emojis?.join(" ")}.
      Background style: ${art.backgroundStyle}.
      Accent colors: ${art.accentColors?.join(", ")}.
      Headline: "${voice.headline}"
      Tagline: "${voice.tagline}"
      CTA primary: "${voice.cta.primary}"
      CTA secondary: "${voice.cta.secondary}"
      Style note: "${style.styleNote}"
    `.trim();

    const htmlRaw = await runCodeRouter({ prompt: layoutPrompt, mood });
    if (!htmlRaw) throw new Error("Code generation failed");

    // Clean up backtick-wrapped LLM output and style explanations
    const cleanedHtml = htmlRaw.replace(/```html|```/g, "").trim();
    const splitPoint = cleanedHtml.indexOf("This layout is styled");
    const finalCleanedHtml = splitPoint !== -1 ? cleanedHtml.slice(0, splitPoint).trim() : cleanedHtml;

    const wrappedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${dropName}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="min-h-screen bg-gradient-to-br from-${art.accentColors?.[0] || "pink-400"} to-${art.accentColors?.[1] || "purple-500"} text-white flex flex-col items-center justify-center ${style.animation} ${style.layoutPadding} ${style.textStyle}">
  <div class="${style.borderRadius} ${style.hoverEffect}">
    ${finalCleanedHtml}
  </div>
</body>
</html>
    `.trim();

    const folder = path.join(__dirname, `../drops/${dropName}`);
    fs.mkdirSync(folder, { recursive: true });

    fs.writeFileSync(path.join(folder, "index.html"), wrappedHtml);
    fs.writeFileSync(path.join(folder, "branding.json"), JSON.stringify({ art, voice, style }, null, 2));
    fs.writeFileSync(path.join(folder, "mood.txt"), `mood: ${mood}\nstyle: ${art.styleNotes}`);

    console.log(`✅ Drop generated at /drops/${dropName}`);
  } catch (err) {
    console.error("❌ designerAgentLoop failed:", err.message);
  }
}

module.exports = { designerAgentLoop };

