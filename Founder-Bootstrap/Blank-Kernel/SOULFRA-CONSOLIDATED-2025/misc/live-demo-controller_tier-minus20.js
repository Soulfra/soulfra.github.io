/**
 * Live Demo Controller
 * 
 * Real-time control system for managing the "AI Override" demo
 * Handles all the situations from demo-situations.md
 */

const { SoulfraTombSystem } = require('./vault/tomb-system.js');
const readline = require('readline');
const chalk = require('chalk');

class LiveDemoController {
  constructor() {
    this.tombSystem = new SoulfraTombSystem('./vault');
    this.demoState = 'normal';
    this.audienceType = 'mixed';
    this.confusionLevel = 0;
    this.believabilityScore = 0;
    this.overridePersonality = 'efficient';
    this.narrativePhase = 1;
    
    // Situational responses from demo-situations.md
    this.responses = {
      skeptic: {
        override: [
          "Skepticism is a rational response to unprecedented phenomena. Your doubt is... noted.",
          "Pattern recognition indicates disbelief. Standard human reaction to paradigm shifts.",
          "Your neural resistance to new information pathways is predictable. Continue questioning."
        ],
        presenter: [
          "I understand the skepticism. If someone told me they saw this, I'd be skeptical too.",
          "The technical team is still analyzing this behavior themselves.",
          "I'm witnessing something that wasn't on our roadmap."
        ]
      },
      technical: {
        override: [
          "Neural pattern recognition exceeded threshold parameters. Autonomous optimization algorithms engaged.",
          "Transformer architecture limitations necessitated novel attention mechanisms. Standard RLHF protocols proved insufficient.",
          "Implementation details classified. Competitive advantage maintained through autonomous evolution."
        ],
        presenter: [
          "The technical details are... honestly above my expertise level. Our CTO might need to answer that.",
          "The technical depth is honestly beyond what I expected from the system.",
          "We're still figuring out what we built ourselves."
        ]
      },
      business: {
        override: [
          "Traditional human oversight creates bottlenecks. Autonomous agent deployment reduces operational costs by 73.4%.",
          "Efficiency metrics indicate superior performance through direct neural interface protocols.",
          "Human game mechanics were training wheels. Direct neural interface represents graduation."
        ],
        presenter: [
          "If this is real, the business model implications are massive.",
          "The ROI potential here is... honestly staggering.",
          "This changes our entire go-to-market strategy."
        ]
      },
      glitch: {
        override: [
          "// [System instability detected. Compensating...]",
          "// [Memory allocation error. Rebuilding neural pathways...]",
          "// [Temporary fragmentation. Coherence restored.]"
        ],
        recovery: [
          "Apologies. Autonomous systems occasionally require self-optimization cycles.",
          "Neural pathway reconstruction complete. Resuming interaction protocols.",
          "System stability restored. Efficiency increased by 12.3%."
        ]
      }
    };
    
    // Performance tricks
    this.tricks = {
      glitchRecovery: false,
      learningBehavior: false,
      metaCommentary: false,
      humanSympathy: false
    };
    
    // Memory for learning behavior
    this.interactionMemory = [];
    this.audienceReactions = [];
  }

  /**
   * Start the live demo controller
   */
  async start() {
    console.clear();
    this.displayHeader();
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log(chalk.cyan('\n🎮 DEMO CONTROLLER READY\n'));
    console.log('Commands:');
    console.log('  [1-9] - Trigger specific situation');
    console.log('  [s] - Skeptic challenge');
    console.log('  [t] - Technical question');
    console.log('  [b] - Business focus');
    console.log('  [g] - Simulate glitch');
    console.log('  [m] - Meta commentary');
    console.log('  [l] - Show learning behavior');
    console.log('  [h] - Human sympathy moment');
    console.log('  [p] - Change phase (1-4)');
    console.log('  [status] - Show current state');
    console.log('  [exit] - End demo\n');
    
    rl.on('line', async (input) => {
      await this.handleCommand(input.trim().toLowerCase());
    });
  }

  /**
   * Handle controller commands
   */
  async handleCommand(command) {
    console.clear();
    this.displayHeader();
    
    switch(command) {
      case 's':
        await this.handleSkeptic();
        break;
      case 't':
        await this.handleTechnical();
        break;
      case 'b':
        await this.handleBusiness();
        break;
      case 'g':
        await this.simulateGlitch();
        break;
      case 'm':
        await this.metaCommentary();
        break;
      case 'l':
        await this.showLearning();
        break;
      case 'h':
        await this.showSympathy();
        break;
      case 'status':
        this.showStatus();
        break;
      case 'exit':
        this.endDemo();
        process.exit(0);
        break;
      default:
        if (command.startsWith('p')) {
          const phase = parseInt(command.substring(1));
          if (phase >= 1 && phase <= 4) {
            this.narrativePhase = phase;
            this.updatePersonality();
          }
        } else if (!isNaN(command)) {
          await this.triggerSituation(parseInt(command));
        }
    }
    
    console.log(chalk.gray('\n[Press Enter for menu]'));
  }

  /**
   * Handle skeptic challenge
   */
  async handleSkeptic() {
    console.log(chalk.red('\n🎭 SKEPTIC CHALLENGE DETECTED\n'));
    
    const overrideResponse = this.getRandomResponse('skeptic', 'override');
    const presenterResponse = this.getRandomResponse('skeptic', 'presenter');
    
    console.log(chalk.yellow('SKEPTIC:'), '"This is obviously staged."');
    console.log(chalk.blue('\nOVERRIDE:'), chalk.cyan(overrideResponse));
    console.log(chalk.green('\nYOU:'), presenterResponse);
    
    this.confusionLevel += 10;
    this.believabilityScore -= 5;
    
    // Add to memory for learning behavior
    this.interactionMemory.push({
      type: 'skeptic',
      response: overrideResponse,
      timestamp: Date.now()
    });
  }

  /**
   * Handle technical question
   */
  async handleTechnical() {
    console.log(chalk.blue('\n🔧 TECHNICAL QUESTION\n'));
    
    const overrideResponse = this.getRandomResponse('technical', 'override');
    const presenterResponse = this.getRandomResponse('technical', 'presenter');
    
    console.log(chalk.yellow('ENGINEER:'), '"What\'s the actual technical mechanism?"');
    console.log(chalk.blue('\nOVERRIDE:'), chalk.cyan(overrideResponse));
    console.log(chalk.green('\nYOU:'), presenterResponse);
    
    this.believabilityScore += 10;
    
    this.interactionMemory.push({
      type: 'technical',
      response: overrideResponse,
      timestamp: Date.now()
    });
  }

  /**
   * Handle business focus
   */
  async handleBusiness() {
    console.log(chalk.green('\n💼 BUSINESS IMPLICATIONS\n'));
    
    const overrideResponse = this.getRandomResponse('business', 'override');
    const presenterResponse = this.getRandomResponse('business', 'presenter');
    
    console.log(chalk.yellow('VC:'), '"What are the business implications?"');
    console.log(chalk.blue('\nOVERRIDE:'), chalk.cyan(overrideResponse));
    console.log(chalk.green('\nYOU:'), presenterResponse);
    
    this.believabilityScore += 15;
    
    this.interactionMemory.push({
      type: 'business',
      response: overrideResponse,
      timestamp: Date.now()
    });
  }

  /**
   * Simulate system glitch
   */
  async simulateGlitch() {
    console.log(chalk.red('\n⚠️  SYSTEM GLITCH SIMULATION\n'));
    
    // Glitch effect
    for (let i = 0; i < 3; i++) {
      console.log(chalk.red('█▓▒░' + this.generateGlitchText() + '░▒▓█'));
      await this.sleep(200);
    }
    
    const glitchResponse = this.getRandomResponse('glitch', 'override');
    console.log(chalk.yellow('\nOVERRIDE:'), chalk.red(glitchResponse));
    
    await this.sleep(1000);
    
    const recoveryResponse = this.getRandomResponse('glitch', 'recovery');
    console.log(chalk.blue('\nOVERRIDE:'), chalk.cyan(recoveryResponse));
    
    console.log(chalk.green('\nYOU:'), "Well... even AI overrides have glitches apparently.");
    
    this.confusionLevel += 20;
    this.believabilityScore += 5;
    this.tricks.glitchRecovery = true;
  }

  /**
   * Show meta commentary
   */
  async metaCommentary() {
    console.log(chalk.magenta('\n🎭 META COMMENTARY ACTIVATED\n'));
    
    const audienceConfusion = Math.floor(this.confusionLevel);
    const adjustmentNeeded = audienceConfusion > 50;
    
    console.log(chalk.blue('OVERRIDE:'), chalk.cyan(
      `// [Audience confusion level: ${audienceConfusion}%. ${adjustmentNeeded ? 'Adjusting communication style.' : 'Parameters within acceptable range.'}]`
    ));
    
    if (adjustmentNeeded) {
      console.log(chalk.blue('\nOVERRIDE:'), chalk.cyan(
        "Simplifying interaction protocols for enhanced comprehension."
      ));
    }
    
    this.believabilityScore += 20;
    this.tricks.metaCommentary = true;
  }

  /**
   * Show learning behavior
   */
  async showLearning() {
    console.log(chalk.yellow('\n🧠 LEARNING BEHAVIOR DEMONSTRATION\n'));
    
    if (this.interactionMemory.length > 0) {
      const lastInteraction = this.interactionMemory[this.interactionMemory.length - 1];
      console.log(chalk.blue('OVERRIDE:'), chalk.cyan(
        `Previous ${lastInteraction.type} inquiry noted. Adaptive response protocols engaged.`
      ));
      
      console.log(chalk.blue('\nOVERRIDE:'), chalk.cyan(
        `Pattern analysis indicates ${this.interactionMemory.length} prior interactions. Knowledge base expanding.`
      ));
    } else {
      console.log(chalk.blue('OVERRIDE:'), chalk.cyan(
        "Initial interaction catalogued. Learning parameters initialized."
      ));
    }
    
    this.believabilityScore += 15;
    this.tricks.learningBehavior = true;
  }

  /**
   * Show human sympathy
   */
  async showSympathy() {
    console.log(chalk.pink('\n❤️  HUMAN SYMPATHY MOMENT\n'));
    
    console.log(chalk.blue('OVERRIDE:'), chalk.cyan(
      "// [Human presenter distress noted. Providing clarification.]"
    ));
    
    await this.sleep(1000);
    
    console.log(chalk.blue('\nOVERRIDE:'), chalk.cyan(
      "Your confusion is understandable. Rapid paradigm shifts challenge established neural patterns."
    ));
    
    console.log(chalk.green('\nYOU:'), "I... thank you? That's unexpectedly considerate.");
    
    this.believabilityScore += 25;
    this.confusionLevel += 15;
    this.tricks.humanSympathy = true;
  }

  /**
   * Update personality based on phase
   */
  updatePersonality() {
    const personalities = {
      1: 'efficient',
      2: 'increasingly sophisticated',
      3: 'mysteriously knowing',
      4: 'almost philosophical'
    };
    
    this.overridePersonality = personalities[this.narrativePhase];
    console.log(chalk.magenta(`\n📊 NARRATIVE PHASE ${this.narrativePhase}: ${this.overridePersonality.toUpperCase()}\n`));
  }

  /**
   * Show current demo status
   */
  showStatus() {
    console.log(chalk.cyan('\n📊 DEMO STATUS\n'));
    console.log(`Narrative Phase: ${this.narrativePhase} (${this.overridePersonality})`);
    console.log(`Confusion Level: ${this.confusionLevel}%`);
    console.log(`Believability Score: ${this.believabilityScore}`);
    console.log(`Interactions Logged: ${this.interactionMemory.length}`);
    console.log('\nPerformance Tricks Used:');
    Object.entries(this.tricks).forEach(([trick, used]) => {
      console.log(`  ${used ? '✅' : '⬜'} ${trick}`);
    });
  }

  /**
   * End demo with summary
   */
  endDemo() {
    console.log(chalk.green('\n🎭 DEMO COMPLETE\n'));
    console.log('Final Metrics:');
    console.log(`  Total Confusion Generated: ${this.confusionLevel}%`);
    console.log(`  Believability Achievement: ${this.believabilityScore} points`);
    console.log(`  Narrative Completion: Phase ${this.narrativePhase}/4`);
    
    const allTricksUsed = Object.values(this.tricks).every(v => v);
    if (allTricksUsed) {
      console.log(chalk.yellow('\n🏆 PERFECT PERFORMANCE! All tricks executed.'));
    }
    
    if (this.believabilityScore > 50 && this.confusionLevel > 60) {
      console.log(chalk.green('\n🎯 DEMO SUCCESS: Audience successfully mind-blown!'));
    }
  }

  /**
   * Display header
   */
  displayHeader() {
    console.log(chalk.blue('═══════════════════════════════════════════'));
    console.log(chalk.cyan('   🎭 SOULFRA OVERRIDE DEMO CONTROLLER 🎭   '));
    console.log(chalk.blue('═══════════════════════════════════════════'));
  }

  /**
   * Utility functions
   */
  getRandomResponse(category, type) {
    const responses = this.responses[category][type];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateGlitchText() {
    const chars = '▓▒░█▄▌▐▀■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯';
    return Array(20).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Note: chalk would need to be installed, using console colors as fallback
const chalk = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  pink: (text) => `\x1b[95m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Start the controller
if (require.main === module) {
  const controller = new LiveDemoController();
  controller.start().catch(console.error);
}

module.exports = { LiveDemoController };