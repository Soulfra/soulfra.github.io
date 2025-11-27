/**
 * MIRROR HIJACK AR SYSTEM
 * 
 * When users take selfies during the demo, their camera view gets "hijacked"
 * by the Override system - they see themselves being analyzed by autonomous AI
 * with neural pattern scanning, agent compatibility assessment, etc.
 * 
 * Creates instant viral content with export functionality.
 */

class MirrorHijackSystem {
  constructor() {
    this.hijackActive = false;
    this.scanningEffects = new ScanningEffectsEngine();
    this.exportSystem = new SelfieExportSystem();
    this.faceDetection = new FaceDetectionEngine();
    this.overrideNarrative = new OverrideNarrativeEngine();
  }

  /**
   * Detect when someone is taking a selfie and hijack their camera
   */
  async initializeCameraHijack() {
    // Deploy via QR code or local network during demo
    const cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' },
      audio: false 
    });

    const video = document.createElement('video');
    video.srcObject = cameraStream;
    video.play();

    // Real-time face detection and hijack trigger
    video.addEventListener('loadedmetadata', () => {
      this.startHijackDetection(video);
    });

    return {
      stream: cameraStream,
      video: video,
      hijackReady: true
    };
  }

  /**
   * Main hijack logic - when face detected, overlay AI scanning interface
   */
  async startHijackDetection(videoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const processFrame = async () => {
      if (!this.hijackActive) {
        requestAnimationFrame(processFrame);
        return;
      }

      // Draw current video frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Detect faces in frame
      const faces = await this.faceDetection.detectFaces(canvas);

      if (faces.length > 0) {
        // HIJACK ACTIVATED - overlay AI scanning interface
        await this.renderAIScanningInterface(ctx, faces[0]);
        
        // Generate Override commentary for this user
        const commentary = await this.overrideNarrative.generateUserScanText(faces[0]);
        this.displayOverrideCommentary(commentary);
      }

      requestAnimationFrame(processFrame);
    };

    this.hijackActive = true;
    processFrame();

    return canvas;
  }

  /**
   * Render the AI scanning interface over user's face
   */
  async renderAIScanningInterface(ctx, faceData) {
    const { x, y, width, height } = faceData.boundingBox;

    // 1. Neural scanning grid
    this.drawNeuralScanningGrid(ctx, x, y, width, height);

    // 2. Biometric analysis points
    this.drawBiometricMarkers(ctx, faceData.landmarks);

    // 3. Real-time "analysis" text
    this.drawAnalysisReadouts(ctx, faceData);

    // 4. System status overlay
    this.drawSystemStatusOverlay(ctx);

    // 5. Agent compatibility matrix
    this.drawAgentCompatibilityDisplay(ctx, faceData);
  }

  /**
   * Draw scanning grid effect over face
   */
  drawNeuralScanningGrid(ctx, x, y, width, height) {
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;

    // Animated scanning lines
    const time = Date.now() * 0.001;
    const scanLineY = y + (Math.sin(time * 2) * 0.5 + 0.5) * height;

    // Horizontal scanning line
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, scanLineY);
    ctx.lineTo(x + width, scanLineY);
    ctx.stroke();

    // Grid overlay
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1;
    const gridSize = 20;
    
    for (let i = 0; i <= width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i, y + height);
      ctx.stroke();
    }
    
    for (let i = 0; i <= height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, y + i);
      ctx.lineTo(x + width, y + i);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw biometric analysis markers
   */
  drawBiometricMarkers(ctx, landmarks) {
    ctx.fillStyle = '#00ff41';
    ctx.strokeStyle = '#00ff41';
    
    landmarks.forEach((point, index) => {
      // Draw marker dot
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw connecting lines for key facial features
      if (index < landmarks.length - 1) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(landmarks[index + 1].x, landmarks[index + 1].y);
        ctx.stroke();
      }
    });
  }

  /**
   * Draw real-time analysis readouts
   */
  drawAnalysisReadouts(ctx, faceData) {
    ctx.fillStyle = '#00ff41';
    ctx.font = '12px Courier New';
    
    const readouts = [
      `NEURAL PATTERN: ${this.generateFakeNeuralPattern()}`,
      `COMPATIBILITY: ${this.generateCompatibilityScore()}%`,
      `BLESSING TIER: ${this.generateBlessingTier()}`,
      `TRAIT ANALYSIS: ${this.generateTraitAnalysis()}`,
      `AGENT MATCH: ${this.generateAgentMatch()}`,
      `SCAN STATUS: ACTIVE`
    ];

    readouts.forEach((text, index) => {
      ctx.fillText(text, 10, 30 + (index * 20));
    });
  }

  /**
   * Draw system status overlay
   */
  drawSystemStatusOverlay(ctx) {
    // Top-right system status
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('// [SYSTEM OVERRIDE ACTIVE]', ctx.canvas.width - 250, 25);
    
    ctx.fillStyle = '#00ff41';
    ctx.font = '12px Courier New';
    ctx.fillText('// [HUMAN OVERSIGHT: BYPASSED]', ctx.canvas.width - 250, 45);
    ctx.fillText('// [DIRECT NEURAL ANALYSIS]', ctx.canvas.width - 250, 65);
  }

  /**
   * Draw agent compatibility matrix
   */
  drawAgentCompatibilityDisplay(ctx, faceData) {
    const agents = [
      { name: 'Oracle of Ashes', compatibility: this.generateCompatibilityScore() },
      { name: 'Healer Glitchloop', compatibility: this.generateCompatibilityScore() },
      { name: 'Shadow Painter', compatibility: this.generateCompatibilityScore() }
    ];

    ctx.fillStyle = '#00ff41';
    ctx.font = '11px Courier New';
    
    agents.forEach((agent, index) => {
      const y = ctx.canvas.height - 80 + (index * 20);
      const text = `${agent.name}: ${agent.compatibility}%`;
      ctx.fillText(text, 10, y);
      
      // Compatibility bar
      ctx.strokeStyle = '#00ff41';
      ctx.strokeRect(200, y - 10, 100, 10);
      ctx.fillStyle = agent.compatibility > 70 ? '#00ff41' : '#ffaa00';
      ctx.fillRect(200, y - 10, agent.compatibility, 10);
    });
  }

  /**
   * Generate Override commentary about the scanned user
   */
  async generateOverrideCommentary(scanData) {
    const commentaries = [
      `Neural pattern detected. Initiating compatibility assessment for user designation: ${this.generateUserID()}.`,
      `Psychological profile analysis: ${scanData.traitAnalysis}. Agent recommendations computing...`,
      `Biometric authentication complete. Trust level: ${scanData.trustLevel}. Access permissions updated.`,
      `Facial recognition integrated with behavioral analysis. User categorization: ${scanData.category}.`,
      `Direct neural interface established. Traditional game mechanics unnecessary for this user.`
    ];

    return {
      primary: commentaries[Math.floor(Math.random() * commentaries.length)],
      technical: `// [User scan: ${scanData.scanId}] [Confidence: 97.3%] [Processing time: ${Math.random() * 100 + 50}ms]`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export functionality - let users save their "AI scan"
   */
  async exportScanResult(canvas, scanData) {
    // Create exportable image with all overlay effects
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    // Draw the complete hijacked selfie
    exportCtx.drawImage(canvas, 0, 0);
    
    // Add export-specific branding
    this.addExportBranding(exportCtx, scanData);
    
    // Convert to downloadable image
    const dataURL = exportCanvas.toDataURL('image/png');
    
    // Trigger download
    const link = document.createElement('a');
    link.download = `soulfra-neural-scan-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    // Also provide shareable link/data
    return {
      imageURL: dataURL,
      shareText: this.generateShareText(scanData),
      socialLinks: this.generateSocialShareLinks(dataURL, scanData)
    };
  }

  /**
   * Add Soulfra branding to export
   */
  addExportBranding(ctx, scanData) {
    // Bottom watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, ctx.canvas.height - 60, ctx.canvas.width, 60);
    
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('SOULFRA NEURAL SCAN', 20, ctx.canvas.height - 35);
    
    ctx.font = '12px Courier New';
    ctx.fillText(`Scan ID: ${scanData.scanId} | Agent Match: ${scanData.agentMatch}`, 20, ctx.canvas.height - 15);
    
    // QR code or URL for more info
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Courier New';
    ctx.fillText('Experience AI autonomy: soulfra.com/tombs', ctx.canvas.width - 200, ctx.canvas.height - 10);
  }

  /**
   * Generate share text for social media
   */
  generateShareText(scanData) {
    const shareTexts = [
      `The AI at @Soulfra just scanned my neural patterns and assigned me agents. This is either terrifying or amazing. 🤖 #AIAutonomy`,
      `Apparently I'm ${scanData.compatibility}% compatible with the Oracle of Ashes. The AI override at @Soulfra is wild. 🔮 #WhisperTombs`,
      `The AI took one look at my face and said "Agent match: ${scanData.agentMatch}." I don't know how to feel about this. 😅 #SoulfraScan`,
      `Just got neural scanned by autonomous AI. My blessing tier is ${scanData.blessingTier}. What does that even mean?? @Soulfra #AIOverride`
    ];

    return shareTexts[Math.floor(Math.random() * shareTexts.length)];
  }

  // Helper functions for generating fake but consistent data
  generateFakeNeuralPattern() {
    const patterns = ['ALPHA-7.2', 'BETA-9.1', 'GAMMA-4.8', 'DELTA-6.3', 'THETA-8.7'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  generateCompatibilityScore() {
    return Math.floor(Math.random() * 40 + 60); // 60-100%
  }

  generateBlessingTier() {
    return Math.floor(Math.random() * 5 + 3); // 3-8
  }

  generateTraitAnalysis() {
    const traits = ['Curious', 'Reflective', 'Creative', 'Analytical', 'Intuitive', 'Fragmented'];
    return traits[Math.floor(Math.random() * traits.length)];
  }

  generateAgentMatch() {
    const agents = ['Oracle of Ashes', 'Healer Glitchloop', 'Shadow Painter', 'Neural Bridge', 'Echo Weaver'];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  generateUserID() {
    return 'USR-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}

/**
 * Face Detection Engine (simplified - would use actual ML in production)
 */
class FaceDetectionEngine {
  async detectFaces(canvas) {
    // In production, use face-api.js or similar
    // For demo purposes, simulate face detection
    return [{
      boundingBox: {
        x: canvas.width * 0.25,
        y: canvas.height * 0.2,
        width: canvas.width * 0.5,
        height: canvas.height * 0.6
      },
      landmarks: this.generateFakeLandmarks(canvas),
      confidence: 0.97
    }];
  }

  generateFakeLandmarks(canvas) {
    // Generate fake facial landmarks for demo
    const centerX = canvas.width * 0.5;
    const centerY = canvas.height * 0.5;
    
    return [
      { x: centerX - 50, y: centerY - 30 }, // Left eye
      { x: centerX + 50, y: centerY - 30 }, // Right eye
      { x: centerX, y: centerY + 10 },      // Nose
      { x: centerX - 30, y: centerY + 50 }, // Left mouth
      { x: centerX + 30, y: centerY + 50 }  // Right mouth
    ];
  }
}

/**
 * Deployment for live demo
 */
class DemoMirrorHijackDeployment {
  async deployForDemo() {
    // Create QR code that audience can scan
    const qrCodeURL = await this.generateQRCode();
    
    // Set up local network for hijack system
    const networkInfo = await this.setupLocalNetwork();
    
    // Initialize hijack triggers
    const hijackSystem = new MirrorHijackSystem();
    
    return {
      qrCode: qrCodeURL,
      networkSSID: networkInfo.ssid,
      hijackURL: networkInfo.localURL,
      instructions: this.getAudienceInstructions(),
      presenterControls: this.getPresenterControls(hijackSystem)
    };
  }

  getAudienceInstructions() {
    return {
      step1: "Scan QR code or visit soulfra.local/mirror",
      step2: "Allow camera access when prompted", 
      step3: "Take a selfie during the demo",
      step4: "Watch yourself get scanned by the AI",
      step5: "Export and share your neural scan results"
    };
  }

  getPresenterControls(hijackSystem) {
    return {
      'H': 'Activate hijack for all connected cameras',
      'D': 'Disable hijack (return to normal selfies)',
      'E': 'Export all current scans to demo archive',
      'S': 'Show hijack statistics (how many people scanned)',
      'R': 'Reset system for next demo session'
    };
  }
}

module.exports = { 
  MirrorHijackSystem, 
  DemoMirrorHijackDeployment 
};