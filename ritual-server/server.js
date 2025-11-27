import express from "express";
import cors from "cors";
import uploadRitual from "./routes/uploadRitualRoute.js";

const app = express();
app.use(cors({
  origin: "https://souloneth.vercel.app",
  methods: ["GET", "POST"],
  credentials: true,
  allowedHeaders: ["Content-Type"]
}));

app.use("/uploadRitual", uploadRitual);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Ritual server running on port ${port}`);
});