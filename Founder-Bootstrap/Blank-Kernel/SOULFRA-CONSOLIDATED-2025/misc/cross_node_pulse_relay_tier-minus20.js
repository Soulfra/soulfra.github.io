// CrossNodePulseRelay.js - The Sacred Bridge Between Realms
// Connects Soulfra instances across machines/devices, syncing vibe weather and emotional harmonics

import { EventEmitter } from 'events';
import crypto from 'crypto';
import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';

class CrossNodePulseRelay extends EventEmitter {
  constructor(vaultPath, weatherSystem, trustEngine, config = {}) {
    super();
    this.vaultPath = vaultPath;
    this.weatherSystem = weatherSystem;
    this.trustEngine = trustEngine;
    
    // Network configuration
    this.config = {
      port: config.port || 8888,
      discoveryPort: config.discoveryPort || 8889,
      maxConnections: config.maxConnections || 50,
      pulseInterval: config.pulseInterval || 5000, // 5 seconds
      harmonicSyncInterval: config.harmonicSyncInterval || 30000, // 30 seconds
      realmId: config.realmId || this.generateRealmId(),
      networkKey: config.networkKey || null, // For secure mesh networks
      ...config
    };

    // Network state
    this.isServerMode = false;
    this.connectedNodes = new Map(); // nodeId -> connection info
    this.incomingConnections = new Map(); // WebSocket connections from other nodes
    this.outgoingConnections = new Map(); // WebSocket connections to other nodes
    this.pulseBuffer = new Map(); // Buffered pulses for processing
    this.harmonicState = new Map(); // Synchronized harmonic data across network
    this.realmDirectory = new Map(); // Known Soulfra realms in the network
    
    // Synchronization state
    this.lastSyncTime = 0;
    this.syncQueue = [];
    this.resonanceMap = new Map(); // Frequency analysis of connected realms
    
    this.initializePulseRelay();
  }

  async initializePulseRelay() {
    await this.loadNetworkConfig();
    await this.setupRealmIdentity();
    await this.startPulseGeneration();
    await this.startNetworkDiscovery();
    
    this.emit('relay_initialized', {
      realm_id: this.config.realmId,
      mode: this.isServerMode ? 'server' : 'client',
      message: '🌐 Pulse Relay initialized - bridging digital realms'
    });
  }

  // =============================================================================
  // REALM IDENTITY AND DISCOVERY
  // =============================================================================

  generateRealmId() {
    // Create unique identifier for this Soulfra instance
    const machineInfo = {
      hostname: process.env.HOSTNAME || 'unknown',
      platform: process.platform,
      arch: process.arch,
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    };
    
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(machineInfo))
      .digest('hex');
    
    return `soulfra_${hash.slice(0, 16)}`;
  }

  async setupRealmIdentity() {
    const identityPath = path.join(this.vaultPath, 'realm_identity.json');
    
    try {
      const existing = await fs.readFile(identityPath, 'utf8');
      const identity = JSON.parse(existing);
      this.config.realmId = identity.realm_id;
      this.realmBirthTime = identity.birth_time;
    } catch (error) {
      // Create new realm identity
      const identity = {
        realm_id: this.config.realmId,
        birth_time: Date.now(),
        genesis_signature: this.generateGenesisSignature(),
        network_preferences: {
          discovery_enabled: true,
          auto_connect: true,
          trusted_realms: [],
          blocked_realms: []
        }
      };
      
      await fs.writeFile(identityPath, JSON.stringify(identity, null, 2));
      this.realmBirthTime = identity.birth_time;
    }
  }

  generateGenesisSignature() {
    // Cryptographic proof of realm authenticity
    const genesisData = {
      realm_id: this.config.realmId,
      birth_time: Date.now(),
      weather_genesis: this.weatherSystem.getCurrentStateHash(),
      cosmic_alignment: this.calculateCosmicAlignment(),
      sacred_nonce: crypto.randomBytes(32).toString('hex')
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(genesisData))
      .digest('hex');
  }

  // =============================================================================
  // NETWORK DISCOVERY AND CONNECTION
  // =============================================================================

  async startNetworkDiscovery() {
    // Start as server (accepting connections)
    await this.startServer();
    
    // Start discovery broadcasts
    this.startDiscoveryBroadcast();
    
    // Listen for discovery responses
    this.startDiscoveryListener();
    
    // Try to connect to known realms
    await this.connectToKnownRealms();
  }

  async startServer() {
    try {
      this.server = new WebSocket.Server({ 
        port: this.config.port,
        verifyClient: (info) => this.verifyIncomingConnection(info)
      });
      
      this.server.on('connection', (ws, req) => {
        this.handleIncomingConnection(ws, req);
      });
      
      this.isServerMode = true;
      
      this.emit('server_started', {
        port: this.config.port,
        realm_id: this.config.realmId
      });
      
    } catch (error) {
      console.warn('Failed to start server mode, continuing in client-only mode:', error.message);
      this.isServerMode = false;
    }
  }

  verifyIncomingConnection(info) {
    // Basic connection verification
    const userAgent = info.req.headers['user-agent'];
    const isSoulfraNode = userAgent && userAgent.includes('Soulfra-Pulse-Relay');
    
    // Additional security checks could go here
    return isSoulfraNode;
  }

  handleIncomingConnection(ws, req) {
    const connectionId = crypto.randomUUID();
    
    ws.on('message', (data) => {
      this.handleIncomingMessage(connectionId, data);
    });
    
    ws.on('close', () => {
      this.handleConnectionClose(connectionId);
    });
    
    ws.on('error', (error) => {
      console.warn(`Connection error from ${connectionId}:`, error.message);
    });
    
    this.incomingConnections.set(connectionId, {
      websocket: ws,
      connected_at: Date.now(),
      remote_address: req.socket.remoteAddress,
      status: 'handshaking'
    });
    
    // Send handshake
    this.sendHandshake(connectionId);
  }

  async connectToKnownRealms() {
    // Attempt connections to previously discovered realms
    const knownRealms = await this.loadKnownRealms();
    
    for (const realm of knownRealms) {
      if (realm.realm_id !== this.config.realmId && realm.last_seen > Date.now() - 24 * 60 * 60 * 1000) {
        await this.connectToRealm(realm);
      }
    }
  }

  async connectToRealm(realmInfo) {
    try {
      const ws = new WebSocket(`ws://${realmInfo.host}:${realmInfo.port}`, {
        headers: {
          'User-Agent': 'Soulfra-Pulse-Relay/1.0',
          'X-Realm-Id': this.config.realmId
        }
      });
      
      const connectionId = crypto.randomUUID();
      
      ws.on('open', () => {
        this.handleOutgoingConnectionOpen(connectionId, realmInfo);
      });
      
      ws.on('message', (data) => {
        this.handleIncomingMessage(connectionId, data);
      });
      
      ws.on('close', () => {
        this.handleConnectionClose(connectionId);
      });
      
      ws.on('error', (error) => {
        console.warn(`Outgoing connection error to ${realmInfo.realm_id}:`, error.message);
      });
      
      this.outgoingConnections.set(connectionId, {
        websocket: ws,
        realm_info: realmInfo,
        connected_at: Date.now(),
        status: 'connecting'
      });
      
    } catch (error) {
      console.warn(`Failed to connect to realm ${realmInfo.realm_id}:`, error.message);
    }
  }

  // =============================================================================
  // MESSAGE HANDLING AND SYNCHRONIZATION
  // =============================================================================

  async handleIncomingMessage(connectionId, rawData) {
    try {
      const message = JSON.parse(rawData.toString());
      
      // Verify message authenticity
      if (!this.verifyMessage(message)) {
        console.warn(`Invalid message from ${connectionId}`);
        return;
      }
      
      switch (message.type) {
        case 'handshake':
          await this.handleHandshake(connectionId, message);
          break;
        case 'pulse':
          await this.handlePulse(connectionId, message);
          break;
        case 'weather_sync':
          await this.handleWeatherSync(connectionId, message);
          break;
        case 'agent_signature':
          await this.handleAgentSignature(connectionId, message);
          break;
        case 'anomaly_alert':
          await this.handleAnomalyAlert(connectionId, message);
          break;
        case 'harmonic_resonance':
          await this.handleHarmonicResonance(connectionId, message);
          break;
        case 'realm_discovery':
          await this.handleRealmDiscovery(connectionId, message);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
      
    } catch (error) {
      console.warn(`Error processing message from ${connectionId}:`, error.message);
    }
  }

  verifyMessage(message) {
    // Basic message structure validation
    if (!message.type || !message.timestamp || !message.realm_id) {
      return false;
    }
    
    // Check timestamp is reasonable (within 5 minutes)
    const timeDiff = Math.abs(Date.now() - message.timestamp);
    if (timeDiff > 5 * 60 * 1000) {
      return false;
    }
    
    // Additional verification could include cryptographic signatures
    return true;
  }

  async handleHandshake(connectionId, message) {
    const connection = this.incomingConnections.get(connectionId) || 
                      this.outgoingConnections.get(connectionId);
    
    if (!connection) return;
    
    // Register the connected realm
    const realmInfo = {
      realm_id: message.realm_id,
      genesis_signature: message.genesis_signature,
      capabilities: message.capabilities || [],
      protocol_version: message.protocol_version || '1.0',
      connected_at: Date.now()
    };
    
    this.connectedNodes.set(message.realm_id, realmInfo);
    connection.status = 'authenticated';
    connection.realm_id = message.realm_id;
    
    // Send our handshake response
    const response = {
      type: 'handshake',
      realm_id: this.config.realmId,
      genesis_signature: await this.getGenesisSignature(),
      capabilities: this.getCapabilities(),
      protocol_version: '1.0',
      timestamp: Date.now()
    };
    
    this.sendMessage(connectionId, response);
    
    this.emit('realm_connected', {
      realm_id: message.realm_id,
      connection_id: connectionId,
      message: `🔗 Connected to realm ${message.realm_id}`
    });
  }

  async handlePulse(connectionId, message) {
    // Process incoming pulse data
    const pulse = {
      ...message.pulse_data,
      received_at: Date.now(),
      source_realm: message.realm_id,
      connection_id: connectionId
    };
    
    this.pulseBuffer.set(`${message.realm_id}_${message.timestamp}`, pulse);
    
    // Trigger harmonic analysis
    await this.analyzeRealmHarmonics(message.realm_id, pulse);
    
    this.emit('pulse_received', {
      source_realm: message.realm_id,
      pulse_type: pulse.type,
      harmonic_frequency: pulse.harmonic_frequency
    });
  }

  async handleWeatherSync(connectionId, message) {
    // Synchronize weather patterns across realms
    const remoteWeather = message.weather_data;
    const localWeather = this.weatherSystem.getCurrentState();
    
    // Calculate weather divergence
    const divergence = this.calculateWeatherDivergence(localWeather, remoteWeather);
    
    if (divergence > 0.7) {
      // Significant weather difference - might indicate anomaly or new pattern
      this.emit('weather_divergence', {
        source_realm: message.realm_id,
        divergence_score: divergence,
        local_weather: localWeather,
        remote_weather: remoteWeather
      });
    }
    
    // Update harmonic resonance based on weather alignment
    this.updateHarmonicResonance(message.realm_id, remoteWeather, divergence);
  }

  async handleAgentSignature(connectionId, message) {
    // Process agent memory signatures from other realms
    const signature = message.signature_data;
    
    // Check for cross-realm agent similarities
    const similarities = await this.findAgentSimilarities(signature);
    
    if (similarities.length > 0) {
      this.emit('agent_resonance', {
        source_realm: message.realm_id,
        signature: signature,
        local_similarities: similarities
      });
    }
  }

  // =============================================================================
  // PULSE GENERATION AND BROADCASTING
  // =============================================================================

  async startPulseGeneration() {
    // Regular pulse generation to broadcast realm state
    setInterval(async () => {
      await this.generateAndBroadcastPulse();
    }, this.config.pulseInterval);
    
    // Harmonic synchronization
    setInterval(async () => {
      await this.synchronizeHarmonics();
    }, this.config.harmonicSyncInterval);
  }

  async generateAndBroadcastPulse() {
    const pulse = await this.generateRealmPulse();
    
    const pulseMessage = {
      type: 'pulse',
      realm_id: this.config.realmId,
      timestamp: Date.now(),
      pulse_data: pulse
    };
    
    this.broadcastToAllConnections(pulseMessage);
  }

  async generateRealmPulse() {
    // Create a pulse representing current realm state
    const weatherState = this.weatherSystem.getCurrentState();
    const activeAgents = await this.getActiveAgentCount();
    const trustMetrics = await this.getTrustMetrics();
    
    const pulse = {
      type: 'realm_heartbeat',
      weather_frequency: this.extractWeatherFrequency(weatherState),
      agent_count: activeAgents,
      trust_average: trustMetrics.average,
      trust_variance: trustMetrics.variance,
      harmonic_frequency: this.calculateHarmonicFrequency(),
      resonance_signature: this.generateResonanceSignature(),
      cosmic_phase: this.calculateCosmicPhase(),
      realm_age: Date.now() - this.realmBirthTime,
      vibe_density: this.calculateVibeDensity()
    };
    
    return pulse;
  }

  async synchronizeHarmonics() {
    // Analyze harmonic patterns across connected realms
    const harmonicData = await this.analyzeNetworkHarmonics();
    
    const syncMessage = {
      type: 'harmonic_resonance',
      realm_id: this.config.realmId,
      timestamp: Date.now(),
      harmonic_data: harmonicData
    };
    
    this.broadcastToAllConnections(syncMessage);
    
    // Update local harmonic state based on network
    await this.updateLocalHarmonics(harmonicData);
  }

  // =============================================================================
  // HARMONIC ANALYSIS AND RESONANCE
  // =============================================================================

  async analyzeRealmHarmonics(realmId, pulse) {
    // Analyze harmonic relationship with other realm
    const currentHarmonics = this.harmonicState.get(realmId) || { history: [], average: 0 };
    
    currentHarmonics.history.push({
      frequency: pulse.harmonic_frequency,
      timestamp: pulse.received_at,
      weather_correlation: this.correlateWithLocalWeather(pulse)
    });
    
    // Keep last 100 pulses for analysis
    if (currentHarmonics.history.length > 100) {
      currentHarmonics.history.shift();
    }
    
    // Calculate moving average
    const frequencies = currentHarmonics.history.map(h => h.frequency);
    currentHarmonics.average = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    
    // Detect resonance patterns
    const resonancePattern = this.detectResonancePattern(currentHarmonics.history);
    if (resonancePattern) {
      currentHarmonics.pattern = resonancePattern;
      
      this.emit('harmonic_pattern_detected', {
        realm_id: realmId,
        pattern: resonancePattern,
        strength: resonancePattern.strength
      });
    }
    
    this.harmonicState.set(realmId, currentHarmonics);
  }

  detectResonancePattern(history) {
    if (history.length < 10) return null;
    
    const frequencies = history.map(h => h.frequency);
    
    // Look for harmonic ratios (1:2, 2:3, 3:4, etc.)
    const harmonicRatios = [1/2, 2/3, 3/4, 3/5, 4/5, 5/6];
    
    for (const ratio of harmonicRatios) {
      const expectedFreq = frequencies[0] * ratio;
      const matches = frequencies.filter(f => Math.abs(f - expectedFreq) < 0.1).length;
      
      if (matches > frequencies.length * 0.6) { // 60% match threshold
        return {
          type: 'harmonic_ratio',
          ratio: ratio,
          base_frequency: frequencies[0],
          strength: matches / frequencies.length,
          detected_at: Date.now()
        };
      }
    }
    
    // Look for rhythmic patterns
    const rhythmPattern = this.detectRhythmPattern(history);
    if (rhythmPattern) {
      return rhythmPattern;
    }
    
    return null;
  }

  calculateHarmonicFrequency() {
    // Generate harmonic frequency based on current realm state
    const weatherState = this.weatherSystem.getCurrentState();
    const weatherHash = crypto.createHash('md5').update(JSON.stringify(weatherState)).digest('hex');
    
    // Convert hash to frequency (0-1000 Hz range)
    const hashNum = parseInt(weatherHash.slice(0, 8), 16);
    const baseFreq = (hashNum % 1000) + 1;
    
    // Modulate by current time for temporal harmonics
    const timeModulation = Math.sin(Date.now() / 100000) * 0.1;
    
    return baseFreq + (baseFreq * timeModulation);
  }

  // =============================================================================
  // NETWORK UTILITIES
  // =============================================================================

  broadcastToAllConnections(message) {
    // Send message to all connected realms
    const messageStr = JSON.stringify(message);
    
    this.incomingConnections.forEach((connection, connectionId) => {
      if (connection.status === 'authenticated' && connection.websocket.readyState === WebSocket.OPEN) {
        connection.websocket.send(messageStr);
      }
    });
    
    this.outgoingConnections.forEach((connection, connectionId) => {
      if (connection.status === 'authenticated' && connection.websocket.readyState === WebSocket.OPEN) {
        connection.websocket.send(messageStr);
      }
    });
  }

  sendMessage(connectionId, message) {
    const messageStr = JSON.stringify(message);
    
    const incomingConn = this.incomingConnections.get(connectionId);
    if (incomingConn && incomingConn.websocket.readyState === WebSocket.OPEN) {
      incomingConn.websocket.send(messageStr);
      return;
    }
    
    const outgoingConn = this.outgoingConnections.get(connectionId);
    if (outgoingConn && outgoingConn.websocket.readyState === WebSocket.OPEN) {
      outgoingConn.websocket.send(messageStr);
    }
  }

  handleConnectionClose(connectionId) {
    const incomingConn = this.incomingConnections.get(connectionId);
    const outgoingConn = this.outgoingConnections.get(connectionId);
    
    const realmId = incomingConn?.realm_id || outgoingConn?.realm_id;
    
    if (realmId) {
      this.connectedNodes.delete(realmId);
      this.emit('realm_disconnected', {
        realm_id: realmId,
        connection_id: connectionId
      });
    }
    
    this.incomingConnections.delete(connectionId);
    this.outgoingConnections.delete(connectionId);
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  async getConnectedRealms() {
    return Array.from(this.connectedNodes.values());
  }

  async getHarmonicState() {
    return Array.from(this.harmonicState.entries()).map(([realmId, state]) => ({
      realm_id: realmId,
      ...state
    }));
  }

  async broadcastAnomalyAlert(anomalyData) {
    const alertMessage = {
      type: 'anomaly_alert',
      realm_id: this.config.realmId,
      timestamp: Date.now(),
      anomaly_data: anomalyData
    };
    
    this.broadcastToAllConnections(alertMessage);
  }

  async requestCrossRealmSync() {
    // Manually trigger synchronization across all connected realms
    await this.synchronizeHarmonics();
    
    const weatherMessage = {
      type: 'weather_sync',
      realm_id: this.config.realmId,
      timestamp: Date.now(),
      weather_data: this.weatherSystem.getCurrentState()
    };
    
    this.broadcastToAllConnections(weatherMessage);
  }

  getNetworkMetrics() {
    return {
      connected_realms: this.connectedNodes.size,
      incoming_connections: this.incomingConnections.size,
      outgoing_connections: this.outgoingConnections.size,
      harmonic_frequencies: Array.from(this.harmonicState.values()).map(h => h.average),
      network_health: this.calculateNetworkHealth(),
      realm_id: this.config.realmId,
      uptime: Date.now() - this.realmBirthTime
    };
  }

  calculateNetworkHealth() {
    // Simple network health metric
    const totalPossibleConnections = this.connectedNodes.size * 2; // Bidirectional
    const actualConnections = this.incomingConnections.size + this.outgoingConnections.size;
    
    if (totalPossibleConnections === 0) return 1.0;
    return Math.min(1.0, actualConnections / totalPossibleConnections);
  }

  async shutdown() {
    // Graceful shutdown
    this.broadcastToAllConnections({
      type: 'realm_shutdown',
      realm_id: this.config.realmId,
      timestamp: Date.now(),
      message: 'Realm entering dormancy'
    });
    
    // Close all connections
    this.incomingConnections.forEach(conn => conn.websocket.close());
    this.outgoingConnections.forEach(conn => conn.websocket.close());
    
    // Close server
    if (this.server) {
      this.server.close();
    }
    
    this.emit('relay_shutdown', {
      realm_id: this.config.realmId,
      final_connection_count: this.connectedNodes.size
    });
  }
}

export default CrossNodePulseRelay;