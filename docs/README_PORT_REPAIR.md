
# 🛠️ Soulfra Port Repair Guide

## Purpose:
Stabilize the local Soulfra development environment by resolving port conflicts and process collisions.

---

## Key Ports

| Port | Purpose |
|------|---------|
| 7777 | Unified backend server (unified-soulfra-server.js)  
| 9999 | Frontend (mirror-shell via `http.server`)  
| 8080 | Optional NGINX reverse proxy  
| 5000 | Optional LLM or Claude interface  

---

## Common Fix

```bash
# Kill any process on port 7777
lsof -i :7777
kill -9 <PID>

# Start backend cleanly
node unified-soulfra-server.js

# Serve frontend
cd mirror-shell
python3 -m http.server 9999
```

---

## NGINX Fix (optional)

Ensure NGINX only proxies:

```nginx
location /api/ {
    proxy_pass http://localhost:7777/;
}

location / {
    proxy_pass http://localhost:9999/;
}
```
