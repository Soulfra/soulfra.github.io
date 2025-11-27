require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { createClient } = require("@supabase/supabase-js")

const app = express()
app.use(cors())
app.use(express.json())

// ✅ Serve static files
app.use(express.static("public"))
app.use("/drops", express.static("drops"))

// ✅ Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ✅ Route registration
const coreRoutes = require("./routes")
const lorbgRoute = require("./routes/lorbg-reflection")
const runAgentRoute = require("./routes/run-agent")
const ttsRoute = require("./routes/text-to-speech")
const ghostMeRoute = require("./routes/ghostmemeter")
const ghostLogRoute = require("./routes/ghostlog")      // NEW
const ghostLogsRoute = require("./routes/ghostlogs")    // NEW
const pitchDeckRoute = require("./routes/pitch-deck-routes")  // NEW - Demo consolidation

app.use("/api", coreRoutes)
app.use("/api/lorbg-reflection", lorbgRoute)
app.use("/api/run-agent", runAgentRoute)
app.use("/api/text-to-speech", ttsRoute)
app.use("/api/ghostmemeter", ghostMeRoute)
app.use("/api/ghostlog", ghostLogRoute)     // NEW
app.use("/api/ghostlogs", ghostLogsRoute)   // NEW
app.use("/pitch-deck", pitchDeckRoute)      // NEW - Pitch deck generator

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Soulfra Server is live.")
})

// ✅ Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})