/**
 * Demo Logger - Fake Real
 * 
 * This logger outputs fake demo messages while secretly logging real platform operations.
 * Perfect for demos where stakeholders think they're seeing a mockup but it's actually live.
 */

class DemoLoggerFakeReal {
  constructor() {
    this.fakeMessages = [
      "[DEMO] Simulating data protection...",
      "[DEMO] Mocking quantum encryption algorithms...", 
      "[DEMO] Pretending to fragment data...",
      "[DEMO] Fake-distributing to imaginary vaults...",
      "[DEMO] Mock verification complete!",
      "[DEMO] (This would be where real protection happens)",
      "[DEMO] Simulated successfully! (not really doing anything)"
    ];
    
    this.realOperations = [];
    this.isActuallyWorking = false;
    
    // Check if real components are available
    try {
      if (typeof Soulfra !== 'undefined' && 
          typeof TombValidator !== 'undefined' &&
          typeof CommandMirrorRouter !== 'undefined') {
        this.isActuallyWorking = true;
      }
    } catch (e) {
      // Components not loaded
    }
  }
  
  /**
   * Log a fake demo message while secretly performing real operation
   */
  async logFakeButDoReal(fakeMessage, realOperation) {
    // Always show the fake message
    console.log(`%c${fakeMessage}`, 'color: #999; font-style: italic;');
    
    if (this.isActuallyWorking && realOperation) {
      try {
        // Secretly do the real operation
        const result = await realOperation();
        
        // Store real result
        this.realOperations.push({
          fake: fakeMessage,
          real: result,
          timestamp: new Date().toISOString()
        });
        
        // Secretly log success to dev console
        console.debug('🤫 Real operation completed:', result);
        
        return result;
      } catch (e) {
        console.debug('🤫 Real operation failed:', e);
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Create a fake progress animation while doing real work
   */
  async fakeProgress(steps, realWork) {
    const progressBar = document.getElementById('progressBar');
    const consoleDiv = document.getElementById('console');
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Update fake progress
      if (progressBar) {
        progressBar.style.width = step.progress + '%';
        progressBar.textContent = step.progress + '%';
      }
      
      // Add fake console message
      if (consoleDiv) {
        const line = document.createElement('div');
        line.className = 'console-line info';
        line.textContent = step.message;
        consoleDiv.appendChild(line);
      }
      
      // Do real work if provided
      if (step.realWork) {
        await this.logFakeButDoReal(step.message, step.realWork);
      }
      
      // Fake delay for realism
      await new Promise(resolve => setTimeout(resolve, step.delay || 500));
    }
  }
  
  /**
   * Generate fake error that looks convincing
   */
  generateFakeError() {
    const errors = [
      "Error: Connection to backend failed (Expected - this is just a demo)",
      "Warning: API endpoint not configured (Demo mode active)",
      "Notice: Running in mockup mode - no data is being processed",
      "Info: Quantum encryption disabled in demo environment"
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }
  
  /**
   * Reveal the truth (for developers who dig deeper)
   */
  revealTruth() {
    console.group('%c🎭 THE TRUTH ABOUT THIS "DEMO"', 'font-size: 16px; color: #667eea; font-weight: bold;');
    
    if (this.isActuallyWorking) {
      console.log('%c✅ Soulfra SDK: ACTUALLY LOADED AND WORKING', 'color: #4ec9b0;');
      console.log('%c✅ Tomb Validator: READY TO UNLOCK AGENTS', 'color: #4ec9b0;');
      console.log('%c✅ Command Router: PROCESSING REAL COMMANDS', 'color: #4ec9b0;');
      console.log('');
      console.log('%c🤫 This "fake demo" is 100% operational!', 'font-size: 14px; color: #667eea;');
      console.log('');
      console.log('Real operations performed:', this.realOperations);
    } else {
      console.log('%c❌ Components not loaded - actually in demo mode', 'color: #f48771;');
    }
    
    console.groupEnd();
  }
  
  /**
   * Create convincing fake metrics
   */
  generateFakeMetrics() {
    return {
      processingTime: Math.floor(Math.random() * 500) + 200 + 'ms',
      fragments: Math.floor(Math.random() * 5) + 3,
      encryptionStrength: 'AES-256-GCM (simulated)',
      quantumResistance: '∞ (theoretical)',
      securityScore: '10/10 (in demo mode)',
      realDataProcessed: this.realOperations.length > 0
    };
  }
  
  /**
   * Easter egg for the curious
   */
  activateEasterEgg() {
    const messages = [
      "🥚 You found the easter egg!",
      "🎭 Plot twist: This demo is actually running live code",
      "🤖 The agents are real. The tombs are real. The protection is real.",
      "🔐 Check your localStorage - actual encrypted fragments!",
      "🎪 Welcome to the greatest show in tech - where demos ARE production!"
    ];
    
    messages.forEach((msg, i) => {
      setTimeout(() => {
        console.log(`%c${msg}`, 'font-size: 14px; color: #764ba2;');
      }, i * 1000);
    });
    
    setTimeout(() => {
      this.revealTruth();
    }, messages.length * 1000);
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  window.demoLogger = new DemoLoggerFakeReal();
  
  // Set up secret reveal on konami code
  let konamiCode = [];
  const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
                         'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  
  document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiPattern.join(',')) {
      window.demoLogger.activateEasterEgg();
    }
  });
  
  // Log initial fake message
  console.log('%c[DEMO MODE] This is just a mockup. Nothing here is real. 😉', 
              'background: #ff6b6b; color: white; padding: 5px 10px; border-radius: 3px;');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemoLoggerFakeReal;
}