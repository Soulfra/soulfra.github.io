# Safe Process Isolation Guide

## Problem with Original Script

The original `run-isolated.sh` script used `pkill -f ".py"` which kills ALL Python processes on the system, not just our game servers. This can crash other applications like:
- Python-based system tools
- IDE processes
- Other Python applications
- System services

## Safer Alternatives

### 1. Safe Isolated Script (`safe-isolated.sh`)

This script provides process isolation WITHOUT affecting other applications:

**Features:**
- Uses PID files for precise process management
- Only manages our specific game server files
- Graceful shutdown with SIGTERM before SIGKILL
- Resource limits using `nice` to prevent system overload
- No aggressive pkill commands

**Usage:**
```bash
./safe-isolated.sh start    # Start services
./safe-isolated.sh stop     # Stop services safely
./safe-isolated.sh restart  # Restart services
./safe-isolated.sh status   # Check status
./safe-isolated.sh cleanup  # Remove stale PID files
```

### 2. Docker Isolated Script (`docker-isolated.sh`)

Provides complete isolation using Docker containers:

**Features:**
- True process isolation - cannot affect other apps
- Resource limits (CPU: 50%, Memory: 512MB per container)
- Network isolation with custom Docker network
- Easy log access and debugging
- Automatic restart on failure

**Usage:**
```bash
./docker-isolated.sh start              # Start all in Docker
./docker-isolated.sh stop               # Stop containers
./docker-isolated.sh status             # Check status
./docker-isolated.sh logs text-game     # View logs
./docker-isolated.sh shell pure-api     # Debug container
./docker-isolated.sh cleanup            # Remove all
```

### 3. Monitoring Script (`monitor-services.sh`)

Real-time monitoring to prevent system overload:

**Features:**
- Live dashboard showing CPU, memory, uptime
- HTTP health checks for each service
- Automatic alerts for high resource usage
- System notifications on macOS
- Report generation for debugging

**Usage:**
```bash
./monitor-services.sh monitor   # Live monitoring dashboard
./monitor-services.sh report    # Generate status report
./monitor-services.sh tail      # Tail all logs
./monitor-services.sh cleanup   # Clean old logs
```

## Recommended Workflow

### For Development (Quick & Simple):
```bash
# Use safe-isolated.sh for local development
./safe-isolated.sh start
./monitor-services.sh monitor  # In another terminal
```

### For Production (Maximum Isolation):
```bash
# Use Docker for complete isolation
./docker-isolated.sh start
./docker-isolated.sh status
```

### If Apps Crashed:
```bash
# 1. Check what Python processes are affected
ps aux | grep python

# 2. Use safe script to manage only our services
./safe-isolated.sh stop

# 3. Let other apps restart normally
```

## Key Differences from Original

| Feature | Original (Unsafe) | Safe Script | Docker Script |
|---------|------------------|-------------|---------------|
| Process Targeting | Kills ALL .py files | Only our specific files | Container isolated |
| Resource Limits | None | Nice priority | CPU/Memory limits |
| Process Management | None | PID files | Docker containers |
| Other Apps | Can crash them | No impact | Complete isolation |
| Monitoring | None | Via monitor script | Docker stats |

## Emergency Commands

If services are misbehaving:

```bash
# Safely stop our services only
./safe-isolated.sh stop

# Check what's still running
./safe-isolated.sh status

# Clean up any stuck processes
./safe-isolated.sh cleanup

# For Docker
./docker-isolated.sh cleanup
```

## Best Practices

1. **Never use `pkill -f ".py"`** - Too broad, affects system
2. **Always use PID files** - Precise process management
3. **Set resource limits** - Prevent system overload
4. **Monitor actively** - Catch issues early
5. **Use Docker for production** - Complete isolation

## File Structure

```
logs/
  ├── text-game.log
  ├── pure-api.log
  ├── mirror-bridge.log
  ├── white-knight.log
  └── monitor.log

pids/
  ├── text-game.pid
  ├── pure-api.pid
  ├── mirror-bridge.pid
  └── white-knight.pid
```

## Troubleshooting

**Q: Services won't start**
- Check if ports are already in use: `lsof -i :3456`
- Check logs in `logs/` directory
- Run cleanup: `./safe-isolated.sh cleanup`

**Q: High CPU usage**
- Use monitor script to identify problem service
- Restart specific service
- Consider Docker with CPU limits

**Q: Can't stop services**
- Use safe script's stop command
- Check PID files in `pids/`
- Never use aggressive kill commands

Remember: The goal is to manage ONLY our game servers without affecting any other Python processes on the system!