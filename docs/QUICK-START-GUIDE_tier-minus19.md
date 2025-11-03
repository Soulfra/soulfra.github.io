# 🚀 QUICK START: From Zero to Running in 5 Minutes

**For:** Anyone who wants to get Soulfra running NOW  
**Time:** 5 minutes  
**Result:** Everything working  

---

## 📍 Where You Are

You're somewhere in a maze of 20 nested tiers. Don't panic.

---

## 🎯 Step 1: Get to Tier -20 (30 seconds)

```bash
# If you're lost, find tier-minus20
find . -name "tier-minus20" -type d

# Go there
cd [path-to-tier-minus20]

# Verify you're in the right place
ls quantum-symlink-architecture.sh
# Should see the file
```

---

## 🔧 Step 2: Fix Everything (2 minutes)

```bash
# Run ENOENT prevention first
node ultimate-enoent-prevention.js

# Set up quantum symlinks
bash quantum-symlink-architecture.sh

# Make scripts executable
chmod +x *.sh
```

---

## 🚀 Step 3: Launch Everything (1 minute)

```bash
# Start all services
bash master-launch-safe.sh start

# Check status
bash master-launch-safe.sh status
```

---

## ✅ Step 4: Verify It Works (30 seconds)

Open these in your browser:
- http://localhost:3000 - Blank Kernel (Public Entry)
- http://localhost:4040 - Cal Riven CLI
- http://localhost:5000 - Documentation Portal
- http://localhost:6000 - Analytics Dashboard

---

## 🧪 Step 5: Run Tests (1 minute)

```bash
# Run end-to-end tests
bash test-e2e.sh

# If tests fail, run fix again
bash master-launch-safe.sh fix
```

---

## 🎮 What Now?

### Try the AutoCraft Game:
1. Go to http://localhost:3000
2. Click "Start Adventure"
3. Build something
4. Watch analytics at http://localhost:6000

### Check the Logs:
```bash
# View all logs
bash master-launch-safe.sh logs

# View specific service
bash master-launch-safe.sh logs infinity-router
```

### Stop Everything:
```bash
bash master-launch-safe.sh stop
```

---

## 🆘 If Something's Broken

### Nuclear Option:
```bash
# Go to tier-minus20
cd tier-minus20

# Run the fixer
node ultimate-enoent-prevention.js

# Try launching again
bash master-launch-safe.sh start
```

### Still Broken?
1. Check node is installed: `node --version`
2. Check you're in tier-minus20: `pwd`
3. Check logs: `ls logs/`

---

## 📁 Understanding the Structure

### The Secret:
- **Real Code**: `tier-minus17/quantum-source/`
- **Everything Else**: Symlinks to quantum source
- **Why**: Looks complex, actually simple

### Key Directories:
```
tier-minus20/
├── master-launch-safe.sh      # Start everything
├── ultimate-enoent-prevention.js  # Fix everything
├── quantum-symlink-architecture.sh  # Link everything
├── test-e2e.sh               # Test everything
├── logs/                     # All service logs
└── pids/                     # Process IDs
```

---

## 🎯 Next Steps

1. **Get it running** (you just did!)
2. **Try AutoCraft** game
3. **Watch analytics** track everything
4. **Read MASTER-PRODUCTION-PRD.md** for deployment

---

## 💡 Pro Tips

### Quick Navigation:
```bash
# Set up an alias
echo "alias soulfra='cd $(pwd)'" >> ~/.bashrc
source ~/.bashrc

# Now you can always get back
soulfra
```

### Watch Everything:
```bash
# Terminal 1: Watch logs
bash master-launch-safe.sh logs

# Terminal 2: Watch status
watch -n 2 "bash master-launch-safe.sh status"
```

### Development Mode:
```bash
# Edit in quantum source
cd ../tier-minus17/quantum-source/services/

# Changes reflect everywhere immediately!
```

---

**That's it!** You now have a running Soulfra ecosystem.

The impossible architecture is now possible. Welcome to the quantum realm! 🌀