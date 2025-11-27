const express = require('express');
const app = express();
require('dotenv').config();

const runAgent = require('./routes/runAgent');
const soulprint = require('./routes/soulprint');

app.use(express.json());

app.use('/api/runAgent', runAgent);
app.use('/api/soulprint', soulprint);
app.use("/api/tokenBalance", require("./routes/tokenBalance"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Soulfra router listening on http://localhost:${PORT}`);
});