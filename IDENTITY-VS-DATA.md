# Identity vs Data (Keys vs History)

**Your question:** "export identity keys for backup? is that basically like the search history?"

**Answer:** No! They're two completely different things. Let me show you.

---

## The Simple Version

### Identity Keys = Who You Are

```
Like: Your driver's license
Proves: You are YOU
Contains: Public key + Private key
Used for: Logging in, authentication
```

**What gets exported:** Your authentication credentials (backup)

### Search History = What You've Done

```
Like: Your receipts from shopping
Proves: What you bought/searched
Contains: Searches, analyses, data
Used for: Knowledge base, seeing past activity
```

**What stays in database:** Your activity logs (not in export)

---

## What Gets Exported (Identity Keys)

### When You Click "Export"

**File downloaded:** `soulfra-identity-302a300506032b6570.json`

**File contains:**
```json
{
  "version": "1.0",
  "userId": "302a300506032b6570",
  "publicKey": "302a300506032b657003210000abc123def456...",
  "privateKey": "302e020100300506032b6570042204789ghi012..."
}
```

**That's it!** Just your authentication keys.

**File size:** ~500 bytes (tiny!)

---

### What's Actually In Those Keys

**Private Key:**
- Your SECRET credential
- Proves you own this identity
- Like your password (but way better)
- **NEVER** share this with anyone
- **NEVER** post this online
- Store encrypted/secure

**Public Key:**
- Your PUBLIC identifier
- Safe to share
- Stored on server
- Like your username (but cryptographic)

**User ID:**
- First 16 characters of public key
- What shows in the button: "🔐 302a300506032b6570"
- Identifies you

---

### What's NOT In The Export

❌ Your 55 searches
❌ Your 3 Ollama analyses
❌ Your knowledge base
❌ Your VIBES balance
❌ Any of your data
❌ Search history
❌ Timestamps
❌ Saved results

**The export has ZERO data.** Only your authentication keys.

---

## What Stays In Database (Your Data)

### Your Search History

**Stored in:** `deathtodata.db` (SQLite database)

**Table:** `analytics_events`

**Contains:**
```sql
-- Your searches
event_type: "search"
metadata: {"query": "privacy tools", "timestamp": "2026-01-19 12:34:56"}

event_type: "search"
metadata: {"query": "how to code", "timestamp": "2026-01-19 13:20:10"}

-- Your Ollama analyses
event_type: "ollama_analysis"
metadata: {
  "query": "privacy tools",
  "ollama_summary": "Here are the best privacy tools...",
  "result_count": 10,
  "top_sources": [...]
}
```

**Currently stored:** 55 searches, 3 analyses

**This is:** Your activity log, what you've done

**NOT in identity export!** Stays on server.

---

## Side-by-Side Comparison

### Identity Keys Export

| Property | Value |
|----------|-------|
| **What it is** | Authentication credentials |
| **Like** | Your password/login |
| **File name** | soulfra-identity-[userid].json |
| **File size** | ~500 bytes |
| **Contains** | Public key, private key, user ID |
| **Does NOT contain** | Any search history or data |
| **Used for** | Logging in, proving who you are |
| **Storage** | Password manager, encrypted USB |
| **Sensitivity** | HIGH - Keep secret! |
| **Can share?** | NO - Never share private key |

### Search History (Database)

| Property | Value |
|----------|-------|
| **What it is** | Your activity/data |
| **Like** | Your browser history |
| **Stored in** | deathtodata.db (server) |
| **File size** | Growing (currently ~100KB) |
| **Contains** | Searches, analyses, timestamps |
| **Does NOT contain** | Your identity keys |
| **Used for** | Knowledge base, past searches |
| **Storage** | Server database |
| **Sensitivity** | MEDIUM - Personal but not login credential |
| **Can share?** | Maybe - It's your data, your choice |

---

## Real-World Analogies

### Analogy 1: Your House

**Identity Keys:**
- The physical house key
- Proves you own the house
- Lets you unlock the door
- Keep a spare in case you lose it
- Store spare securely (give to trusted person)

**Search History:**
- Everything INSIDE the house
- Your furniture, belongings, stuff
- Record of what you brought home
- History of what happened there
- Stored in the house itself

**Key point:** The spare key does NOT contain your belongings!

---

### Analogy 2: Your Bank

**Identity Keys:**
- Your ATM card + PIN
- Proves you own the account
- Lets you access your money
- Keep in wallet, have backup card
- Never write PIN on card

**Search History:**
- Your transaction history
- What you bought, when, where
- Stored by the bank
- Shows in your statement
- Can request export of transactions

**Key point:** Your ATM card does NOT contain your transaction history!

---

### Analogy 3: Your Phone

**Identity Keys:**
- Your unlock passcode/fingerprint
- Proves it's YOUR phone
- Lets you access the device
- Can set up alternate unlock method
- Keep passcode secret

**Search History:**
- All your photos, messages, apps
- Stored ON the phone
- Your actual data/content
- Can backup separately (iCloud, Google Photos)
- Data exists independent of passcode

**Key point:** Your passcode does NOT contain your photos!

---

## Why Export Identity Keys?

### Scenario 1: New Device

```
Your laptop dies
  ↓
Buy new laptop
  ↓
Visit deathtodata.com
  ↓
No keys in localStorage (fresh browser)
  ↓
Import your backed-up identity JSON file
  ↓
Authenticated as same user!
  ↓
Your search history STILL exists on server
  ↓
See all your old searches/analyses
```

**The exported keys let you PROVE you're the same user.**

**Your data (searches) was on the server the whole time.**

---

### Scenario 2: Clear Browser Data

```
Accidentally clear localStorage
  ↓
Lose your keys
  ↓
Try to search
  ↓
System doesn't recognize you
  ↓
Import your backed-up keys
  ↓
Authenticated again!
  ↓
Access your search history (it never left)
```

---

### Scenario 3: Multiple Devices

```
Use laptop at home
  ↓
Generate keys on laptop
  ↓
Export keys to password manager
  ↓
Go to work
  ↓
Use work computer
  ↓
Import keys from password manager
  ↓
Same identity on both devices!
  ↓
Search history syncs (it's on server)
```

---

## What You Can "Digest" (Store)

### Identity Keys (The Export File)

**Where to store:**

✅ **Password Manager** (Best)
```
1Password, Bitwarden, LastPass
- Encrypted storage
- Syncs across devices
- Auto-fill capable
- Recommended!
```

✅ **Encrypted USB Drive**
```
Buy USB drive
- Encrypt with BitLocker/FileVault
- Store JSON file
- Keep in safe place
```

✅ **Hardware Security Key**
```
YubiKey, Titan Key
- Store keys on hardware device
- Most secure option
- Requires special setup
```

✅ **Encrypted Cloud**
```
Use Cryptomator or Boxcryptor
- Encrypt before uploading
- Then upload to Dropbox/Drive
- Only YOU can decrypt
```

✅ **Physical Backup**
```
- Print the JSON file
- Store in fireproof safe
- Or write down keys (tedious but works)
```

❌ **Do NOT Store Here:**
- Email (not encrypted)
- Desktop file (not encrypted)
- Cloud without encryption
- Social media/GitHub (public!)
- Shared drive at work

---

### Search History (Not In Export)

**Currently:** Stays in database on server

**Future:** Could add export feature for search history

**Would look like:**
```json
{
  "exported_at": "2026-01-19 15:30:00",
  "user_id": "302a300506032b6570",
  "total_searches": 55,
  "searches": [
    {
      "query": "privacy tools",
      "timestamp": "2026-01-19 12:34:56",
      "result_count": 10
    },
    {
      "query": "how to code",
      "timestamp": "2026-01-19 13:20:10",
      "result_count": 8
    }
  ],
  "analyses": [
    {
      "query": "privacy tools",
      "summary": "The best privacy tools are...",
      "timestamp": "2026-01-19 12:35:10"
    }
  ]
}
```

**This would be:** Your DATA (less sensitive than keys)

**Storage:** Anywhere (Google Docs, Notion, local file, etc.)

**But currently:** This feature doesn't exist yet. History stays in database.

---

## Common Confusion

### "If I export keys, can I recover my searches?"

**Answer:** Kind of, but not directly.

**What happens:**
1. You export keys → Get authentication credentials
2. You lose everything (new computer)
3. You import keys → Authenticated as same user
4. Your searches were on SERVER (not in keys export)
5. You see your searches again (they never left the server)

**So:** Keys let you access your account → account has your searches

**But:** Keys file itself does NOT contain searches

**Analogy:** Your house key lets you access your house → house has your stuff → but the key itself is not your stuff

---

### "What if I want to backup my searches?"

**Currently:** They're in the database on server

**Options:**

1. **Trust the server** (data stays there)
2. **Export database** (for self-hosted version)
   ```bash
   # Copy the database file
   cp deathtodata.db ~/Backups/deathtodata-backup-2026-01-19.db
   ```
3. **Future feature:** Add "Export Search History" button
   - Would download separate JSON file
   - Contains your searches/analyses
   - NOT your identity keys

---

### "Can I share my exported keys?"

**NO! NEVER!**

**If you share your private key:**
- Anyone can impersonate you
- Anyone can login as you
- Anyone can see your searches
- Anyone can modify your account
- Identity theft

**It's like sharing:**
- Your password (but worse - can't easily reset)
- Your social security number
- Your house keys

**Only share public key** (safe to share):
```
publicKey: "302a300506032b657003210000abc123..."
```

**NEVER share private key:**
```
privateKey: "302e020100300506032b6570042204789ghi..." ← KEEP SECRET
```

---

## How to Actually Use This

### Step 1: Generate Keys (Once)

1. Go to http://localhost:5051/search.html
2. Click "🔐 Authenticate"
3. Wait for keys to generate
4. See your User ID appear

**Now you have:** Keys stored in browser localStorage

---

### Step 2: Export Keys (Backup)

1. Click your User ID button (e.g. "🔐 302a300506032b6570")
2. Popup asks: "Export your identity keys for backup?"
3. Click OK
4. File downloads: `soulfra-identity-302a300506032b6570.json`

**Now you have:** Backup of your authentication keys

---

### Step 3: Store Exported Keys Securely

**Option A: Password Manager** (Recommended)
```
1. Open 1Password/Bitwarden
2. Create new "Secure Note"
3. Title: "Soulfra Identity Keys"
4. Paste JSON contents
5. Save
```

**Option B: Encrypted USB**
```
1. Insert USB drive
2. Encrypt drive (BitLocker/FileVault)
3. Copy JSON file to drive
4. Store drive in safe place
```

---

### Step 4: Use Your Account

1. Search for things
2. Get Ollama analyses
3. Build knowledge base

**Your searches:** Stored in database (server)

**Your keys:** Stored in browser + backup file

**They're separate!**

---

### Step 5: Recover (If Needed)

**Lost your keys?**
```
1. Visit deathtodata.com
2. Click "Import Identity"
3. Upload your backed-up JSON file
4. Authenticated!
5. See all your old searches (they were on server)
```

**Note:** Import feature doesn't exist yet in the UI, but the concept is there.

---

## Technical Details (If You're Curious)

### What's In The Identity Export (Actual Format)

```json
{
  "version": "1.0",
  "userId": "302a300506032b6570",
  "publicKey": "302a300506032b65700321004fa759cb2bc25a98cbcbb1cca2d43f20503455913c7c5db4b16a78630b08ff4f",
  "privateKey": "302e020100300506032b6570042204206f9c7f5a6b8e9d3c2a1b4e8f7d6c5a9b3e2d1c4f8e7d6c5a9b3e2d1c4f8e7d6c",
  "exportedAt": 1737345678901
}
```

**userId:** First 16 hex chars of public key

**publicKey:** Full Ed25519 public key (hex encoded)

**privateKey:** Full Ed25519 private key (hex encoded)

**exportedAt:** Unix timestamp of when exported

---

### What's In The Database (Search History)

```sql
-- analytics_events table
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY,
  event_type TEXT,
  metadata TEXT,  -- JSON string
  created_at TIMESTAMP
);

-- Example row
INSERT INTO analytics_events (event_type, metadata, created_at)
VALUES (
  'search',
  '{"query":"privacy tools","timestamp":1737345678}',
  '2026-01-19 12:34:56'
);

-- Another row
INSERT INTO analytics_events (event_type, metadata, created_at)
VALUES (
  'ollama_analysis',
  '{"query":"privacy tools","ollama_summary":"The best privacy tools are...","result_count":10}',
  '2026-01-19 12:35:10'
);
```

**This data:** NOT in identity export!

---

## Summary (TL;DR)

### Identity Keys Export

**What:** Your authentication credentials (public + private key)

**File:** `soulfra-identity-[userid].json`

**Size:** ~500 bytes

**Contains:**
- ✅ Private key (SECRET - proves you're you)
- ✅ Public key (identifies you)
- ✅ User ID (derived from public key)

**Does NOT contain:**
- ❌ Search history
- ❌ Ollama analyses
- ❌ Any user data

**Storage:** Password manager, encrypted USB, encrypted cloud

**Like:** Your house key (proves ownership, doesn't contain your stuff)

---

### Search History (Database)

**What:** Your activity/data

**Stored:** `deathtodata.db` on server

**Size:** Growing (~100KB currently)

**Contains:**
- ✅ 55 searches you made
- ✅ 3 Ollama analyses
- ✅ Timestamps, queries, results

**Does NOT contain:**
- ❌ Your private key
- ❌ Your authentication credentials

**Storage:** Server database (or local .db file)

**Like:** What's inside your house (your belongings/data)

---

### The Key Point

**Exported keys** = How you PROVE you're you (authentication)

**Search history** = What you DID (data/activity)

**They're completely separate.**

**Analogy:**
- Keys = Your driver's license (proves identity)
- History = Your shopping receipts (shows activity)

**When you export keys:** You get a backup of your "driver's license" (authentication)

**When you export keys:** You do NOT get your "receipts" (search history)

**Your searches stay on the server** (in database)

**Your keys let you access them** (by proving who you are)

---

**Got it?** You're exporting your LOGIN CREDENTIALS, not your DATA.
