// qr-login.js – Simulates QR login + creates a vault ID

async function loginViaQR() {
  const uuid = "qr-" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("soulfra-uuid", uuid);
  console.log("🔓 Logged in as:", uuid);

  // Simulate vault sync
  await fetch('/api/vault-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuid })
  });

  return uuid;
}
