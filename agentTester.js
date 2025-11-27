const readline = require("readline");
const axios = require("axios");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Agent name: ", (agent) => {
  rl.question("Your message: ", (message) => {
    axios.post("http://localhost:3000/api/runAgent", {
      agent,
      input: { message },
      userId: "tester",
      env: "prod"
    }).then(res => {
      console.log("\n✅ Response:\n", res.data.result);
    }).catch(err => {
      console.error("\n❌ Error:", err.response?.data || err.message);
    }).finally(() => rl.close());
  });
});