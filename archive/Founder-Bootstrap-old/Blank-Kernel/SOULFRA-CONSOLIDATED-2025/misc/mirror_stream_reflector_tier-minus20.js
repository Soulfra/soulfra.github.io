// SOULFRA SPORT MIRROR - Stream Reflection Engine
// Integrates with soulfra-runtime-core.js for vault-native sports reflection

import { SoulfraPlatform } from '../core/soulfra-runtime-core.js';

class MirrorStreamReflector {
  constructor(soulfraPlatform) {
    this.platform = soulfraPlatform;
    this.activeStreams = new Map();
    this.overlayElements = new Map();
    this.streamTypes = {
      youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
      twitch: /twitch\.tv\/(\w+)/,
      m3u8: /\.m3u8$/
    };
  }

  // Main entry point - reflects any stream into sports mirror UI
  async reflectStream(streamUrl, containerId, userFingerprint) {
    try {
      const streamType = this.detectStreamType(streamUrl);
      const streamId = this.generateStreamId(streamUrl);
      
      // Store stream session in vault
      const vaultId = await this.platform.vault.store(
        userFingerprint,
        'sport_stream_session',
        {
          stream_url: streamUrl,
          stream_type: streamType,
          session_start: Date.now(),
          ritual_count: 0
        },
        false // Not sync-eligible
      );

      // Create stream container with Soulfra overlay
      const streamContainer = this.createStreamContainer(containerId, streamId);
      const overlayContainer = this.createSoulframOverlay(streamId, userFingerprint, vaultId);
      
      // Embed stream based on type
      let embedElement;
      switch (streamType) {
        case 'youtube':
          embedElement = await this.embedYouTube(streamUrl, streamContainer);
          break;
        case 'twitch':
          embedElement = await this.embedTwitch(streamUrl, streamContainer);
          break;
        case 'm3u8':
          embedElement = await this.embedM3U8(streamUrl, streamContainer);
          break;
        default:
          throw new Error(`Unsupported stream type: ${streamType}`);
      }

      // Wire up vault event handlers
      this.wireOverlayEvents(streamId, userFingerprint, vaultId);
      
      // Register active stream
      this.activeStreams.set(streamId, {
        url: streamUrl,
        type: streamType,
        element: embedElement,
        userFingerprint,
        vaultId,
        startTime: Date.now()
      });

      return {
        streamId,
        vaultId,
        success: true,
        message: 'Stream reflected into Soulfra mirror'
      };

    } catch (error) {
      console.error('Stream reflection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  detectStreamType(url) {
    if (this.streamTypes.youtube.test(url)) return 'youtube';
    if (this.streamTypes.twitch.test(url)) return 'twitch';
    if (this.streamTypes.m3u8.test(url)) return 'm3u8';
    return 'unknown';
  }

  generateStreamId(url) {
    return `stream_${Date.now()}_${url.slice(-8)}`;
  }

  createStreamContainer(containerId, streamId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    container.innerHTML = `
      <div class="soulfra-mirror-container" data-stream-id="${streamId}">
        <div class="stream-viewport" id="stream-${streamId}">
          <!-- Stream embed goes here -->
        </div>
        <div class="soulfra-overlay" id="overlay-${streamId}">
          <!-- Vault overlay goes here -->
        </div>
      </div>
    `;

    return document.getElementById(`stream-${streamId}`);
  }

  createSoulframOverlay(streamId, userFingerprint, vaultId) {
    const overlayContainer = document.getElementById(`overlay-${streamId}`);
    
    overlayContainer.innerHTML = `
      <div class="vault-whisper-bar">
        <input type="text" 
               id="whisper-input-${streamId}" 
               placeholder="Cast your ritual whisper..."
               maxlength="280">
        <button id="whisper-submit-${streamId}" class="ritual-submit">
          🔮 Cast
        </button>
      </div>
      
      <div class="agent-commentary-feed" id="commentary-${streamId}">
        <div class="commentary-placeholder">
          Awaiting vault resonance...
        </div>
      </div>
      
      <div class="trait-token-bar" id="traits-${streamId}">
        <div class="trait-meter">
          <span class="trait-label">Passion</span>
          <div class="trait-progress" data-trait="passion" style="width: 0%"></div>
        </div>
        <div class="trait-meter">
          <span class="trait-label">Focus</span>
          <div class="trait-progress" data-trait="focus" style="width: 0%"></div>
        </div>
        <div class="trait-meter">
          <span class="trait-label">Loyalty</span>
          <div class="trait-progress" data-trait="loyalty" style="width: 0%"></div>
        </div>
      </div>
      
      <div class="team-blessing-counters">
        <div class="team-counter" data-team="home">
          <span class="team-name">Home</span>
          <span class="blessing-count">0</span>
        </div>
        <div class="team-counter" data-team="away">
          <span class="team-name">Away</span>
          <span class="blessing-count">0</span>
        </div>
      </div>
    `;

    this.overlayElements.set(streamId, overlayContainer);
    return overlayContainer;
  }

  async embedYouTube(url, container) {
    const videoId = this.streamTypes.youtube.exec(url)[1];
    const iframe = document.createElement('iframe');
    
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; encrypted-media';
    
    container.appendChild(iframe);
    return iframe;
  }

  async embedTwitch(url, container) {
    const channelName = this.streamTypes.twitch.exec(url)[1];
    const iframe = document.createElement('iframe');
    
    iframe.src = `https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}&autoplay=true&muted=true`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    
    container.appendChild(iframe);
    return iframe;
  }

  async embedM3U8(url, container) {
    // Use HLS.js for M3U8 streams
    if (typeof Hls !== 'undefined') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.style.width = '100%';
      video.style.height = '100%';
      
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      
      container.appendChild(video);
      return video;
    } else {
      throw new Error('HLS.js required for M3U8 streams');
    }
  }

  wireOverlayEvents(streamId, userFingerprint, vaultId) {
    const whisperInput = document.getElementById(`whisper-input-${streamId}`);
    const whisperSubmit = document.getElementById(`whisper-submit-${streamId}`);
    
    // Handle ritual whisper submission
    const submitWhisper = async () => {
      const whisperText = whisperInput.value.trim();
      if (!whisperText) return;
      
      try {
        // Route through Soulfra platform for vault storage
        const result = await this.platform.processUserRequest(
          userFingerprint,
          `SPORT_WHISPER: ${whisperText}`,
          { 
            storeInVault: true,
            preferredTier: 'local_ollama_first'
          }
        );
        
        // Update trait meters based on whisper emotion
        this.updateTraitMeters(streamId, whisperText);
        
        // Clear input
        whisperInput.value = '';
        
        // Trigger agent commentary response
        this.triggerAgentCommentary(streamId, whisperText, result.trustScore);
        
      } catch (error) {
        console.error('Whisper processing failed:', error);
      }
    };
    
    whisperSubmit.addEventListener('click', submitWhisper);
    whisperInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitWhisper();
    });
  }

  updateTraitMeters(streamId, whisperText) {
    // Simple emotion detection for trait updates
    const passion = this.detectPassion(whisperText);
    const focus = this.detectFocus(whisperText);
    const loyalty = this.detectLoyalty(whisperText);
    
    const traitElements = document.querySelectorAll(`#traits-${streamId} .trait-progress`);
    traitElements.forEach(element => {
      const trait = element.dataset.trait;
      let percentage = 0;
      
      switch (trait) {
        case 'passion': percentage = passion; break;
        case 'focus': percentage = focus; break;
        case 'loyalty': percentage = loyalty; break;
      }
      
      element.style.width = `${Math.min(100, percentage)}%`;
    });
  }

  detectPassion(text) {
    const passionWords = ['amazing', 'incredible', 'fury', 'rage', 'love', 'hate', '!!!', 'CAPS'];
    let score = 0;
    passionWords.forEach(word => {
      if (text.toLowerCase().includes(word.toLowerCase())) score += 20;
    });
    return Math.min(100, score);
  }

  detectFocus(text) {
    const focusWords = ['watch', 'look', 'see', 'strategy', 'play', 'move'];
    let score = 0;
    focusWords.forEach(word => {
      if (text.toLowerCase().includes(word.toLowerCase())) score += 15;
    });
    return Math.min(100, score + 10); // Base focus for engagement
  }

  detectLoyalty(text) {
    const loyaltyWords = ['our', 'team', 'we', 'us', 'always', 'forever'];
    let score = 0;
    loyaltyWords.forEach(word => {
      if (text.toLowerCase().includes(word.toLowerCase())) score += 25;
    });
    return Math.min(100, score);
  }

  async triggerAgentCommentary(streamId, whisperText, trustScore) {
    const commentaryContainer = document.getElementById(`commentary-${streamId}`);
    
    // Add user whisper to feed
    const whisperElement = document.createElement('div');
    whisperElement.className = 'vault-whisper';
    whisperElement.innerHTML = `
      <span class="whisper-text">${whisperText}</span>
      <span class="trust-indicator" data-score="${trustScore}">⚡${trustScore}</span>
    `;
    commentaryContainer.appendChild(whisperElement);
    
    // Scroll to bottom
    commentaryContainer.scrollTop = commentaryContainer.scrollHeight;
  }

  // Clean up stream when done
  async endReflection(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      // Update vault with session end
      await this.platform.vault.store(
        stream.userFingerprint,
        'sport_stream_end',
        {
          stream_id: streamId,
          duration: Date.now() - stream.startTime,
          session_end: Date.now()
        },
        false
      );
      
      this.activeStreams.delete(streamId);
      this.overlayElements.delete(streamId);
    }
  }
}

export { MirrorStreamReflector };