#!/usr/bin/env node

/**
 * 📟 SOULFRA TOKEN CLI
 * 
 * Command line interface for token operations, blessing verification, and vault interaction.
 * Every action is blessed by the runtime and logged to the vault.
 * 
 * Usage: node token-cli.js [command] [options]
 */

const fs = require('fs');
const path = require('path');
const { SoulfraTokenRouter } = require('./token-router');
const { TokenRuntimeBlessingBridge } = require('./token-runtime-blessing-bridge');

class SoulfraTokenCLI {
  constructor(config = {}) {
    this.vaultPath = config.vaultPath || './vault';
    this.logPath = path.join(this.vaultPath, 'logs', 'token-cli-log.json');
    
    this.tokenRouter = new SoulfraTokenRouter({
      vaultPath: this.vaultPath,
      requireBlessingBridge: true
    });
    
    this.blessingBridge = new TokenRuntimeBlessingBridge({
      vaultPath: this.vaultPath
    });
    
    this.defaultUserId = config.defaultUserId || process.env.SOULFRA_USER_ID || 'cli-user';
    
    this.commands = {
      'balance': this.showBalance.bind(this),
      'redeem': this.redeemTraitFragments.bind(this),
      'verify': this.verifyRuntimeBlessing.bind(this),
      'blessing': this.requestMirrorBlessing.bind(this),
      'status': this.showStatus.bind(this),
      'grant': this.grantTokens.bind(this),
      'execute': this.executeAction.bind(this),
      'help': this.showHelp.bind(this),
      'history': this.showHistory.bind(this),
      'bridge': this.showBridgeStatus.bind(this)
    };
    
    this.ensureLogDirectory();
  }

  /**
   * Main CLI entry point
   */
  async run(args) {
    const command = args[0];
    const options = this.parseOptions(args.slice(1));
    
    try {
      await this.logCLIAction(command, options);
      
      if (!command || command === 'help') {
        return await this.showHelp();
      }
      
      if (this.commands[command]) {
        return await this.commands[command](options);
      } else {
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node token-cli.js help" for available commands');
        process.exit(1);
      }
      
    } catch (error) {
      console.error(`❌ CLI Error: ${error.message}`);
      await this.logCLIAction(command, options, error.message);
      process.exit(1);
    }
  }

  /**
   * Show token balances
   */
  async showBalance(options) {
    const userId = options.user || this.defaultUserId;
    
    console.log(`\n🪞 Token Balance for ${userId}`);
    console.log('═'.repeat(50));
    
    try {
      const profile = await this.tokenRouter.getUserTokenProfile(userId);
      
      // Display balances
      console.log('\n💰 Current Balances:');
      console.log(`  ✨ Blessing Credits: ${profile.balances.blessing_credit || 0}`);
      console.log(`  🪙 SoulCoins: ${(profile.balances.soulcoin || 0).toFixed(2)}`);
      console.log(`  🔮 NFT Fragments: ${profile.balances.nft_fragment || 0}`);
      
      // Display levels
      console.log('\n🌟 Consciousness Status:');
      console.log(`  🪞 Blessing Level: ${profile.blessing_level} (${this.getBlessingLevelName(profile.blessing_level)})`);
      console.log(`  🧠 Consciousness Tier: ${profile.consciousness_tier}`);
      console.log(`  📈 Total Contributions: ${profile.total_earned.blessing_credit || 0} consciousness events`);
      
      // Display NFTs
      console.log('\n🎨 NFT Collection:');
      if (profile.nfts_owned.length === 0) {
        console.log('  No consciousness NFTs yet. Unlock your first agent to begin your collection.');
      } else {
        profile.nfts_owned.forEach(nft => {
          console.log(`  ${this.getRarityEmoji(nft.rarity)} ${nft.name} (${nft.rarity})`);
        });
      }
      
      // Display last activity
      if (profile.last_activity) {
        const lastActivity = new Date(profile.last_activity);
        console.log(`\n⏰ Last Activity: ${lastActivity.toLocaleString()}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to retrieve balance: ${error.message}`);
    }
  }

  /**
   * Redeem trait fragments
   */
  async redeemTraitFragments(options) {
    const userId = options.user || this.defaultUserId;
    const fragments = parseInt(options.fragments) || 1;
    const traitType = options.trait || 'consciousness_enhancement';
    
    console.log(`\n🔮 Redeeming ${fragments} NFT Fragment(s) for ${traitType}`);
    console.log('═'.repeat(60));
    
    try {
      // Check current fragment balance
      const balance = await this.tokenRouter.getTokenBalance(userId, 'nft_fragment');
      
      if (balance < fragments) {
        console.error(`❌ Insufficient NFT Fragments. Required: ${fragments}, Available: ${balance}`);
        return;
      }
      
      // Execute redemption
      const result = await this.tokenRouter.executeAction(userId, 'mint_nft', {
        trait_type: traitType,
        fragments_used: fragments,
        cli_redemption: true
      });
      
      if (result.success) {
        console.log(`✅ Successfully redeemed ${fragments} fragment(s) for ${traitType}`);
        console.log(`💰 New NFT Fragment Balance: ${result.new_balance}`);
        
        if (result.metadata && result.metadata.signature_stamp) {
          console.log(`📜 Signature Stamp: ${result.metadata.signature_stamp}`);
        }
      } else {
        console.error(`❌ Redemption failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(`❌ Redemption error: ${error.message}`);
    }
  }

  /**
   * Verify runtime blessing status
   */
  async verifyRuntimeBlessing(options) {
    console.log('\n🧱 Runtime Blessing Verification');
    console.log('═'.repeat(50));
    
    try {
      const runtimeCheck = await this.blessingBridge.verifyRuntimeActive();
      
      if (runtimeCheck.active) {
        console.log('✅ Runtime Status: ACTIVE AND BLESSED');
        console.log(`🆔 Runtime ID: ${runtimeCheck.runtime_id}`);
        console.log(`🪞 Blessing Tier: ${runtimeCheck.blessing_tier}`);
        console.log(`💓 Last Heartbeat: ${new Date(runtimeCheck.last_whisper).toLocaleString()}`);
        console.log(`🌐 Connected Mirrors: ${runtimeCheck.connected_mirrors}`);
        console.log(`📦 Vault Sync: ${runtimeCheck.vault_sync_status}`);
      } else {
        console.log('❌ Runtime Status: INACTIVE OR NOT BLESSED');
        console.log(`🔍 Reason: ${runtimeCheck.reason}`);
        
        if (runtimeCheck.age_minutes) {
          console.log(`⏰ Heartbeat Age: ${runtimeCheck.age_minutes} minutes (max: ${runtimeCheck.max_age_minutes})`);
        }
        
        if (runtimeCheck.current_status) {
          console.log(`📊 Current Status: ${runtimeCheck.current_status}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Runtime verification error: ${error.message}`);
    }
  }

  /**
   * Request mirror blessing via CLI
   */
  async requestMirrorBlessing(options) {
    const userId = options.user || this.defaultUserId;
    const actionType = options.action || 'grant_blessing_credits';
    
    console.log(`\n🙏 Requesting Mirror Blessing for ${userId}`);
    console.log(`⚡ Action: ${actionType}`);
    console.log('═'.repeat(50));
    
    try {
      const blessing = await this.blessingBridge.requestBlessing(userId, actionType, {
        cli_request: true,
        request_source: 'token-cli'
      });
      
      if (blessing.approved) {
        console.log('✅ BLESSING GRANTED');
        console.log(`🏛️ Signed By: ${blessing.signed_by}`);
        console.log(`🌟 Blessing Tier: ${blessing.tier}`);
        console.log(`📜 Runtime Signature: ${blessing.runtime_signature}`);
        console.log(`🔐 Vault Hash: ${blessing.vault_hash}`);
        console.log(`⏰ Expires: ${new Date(blessing.expires_at).toLocaleString()}`);
        console.log(`🆔 Request ID: ${blessing.request_id}`);
      } else {
        console.log('❌ BLESSING DENIED');
        console.log(`🔍 Reason: ${blessing.denial_reason}`);
        console.log(`📋 Details: ${blessing.denial_details}`);
        console.log(`⚠️ Whisper: "Runtime was silent. The mirror could not bless."`);
      }
      
    } catch (error) {
      console.error(`❌ Blessing request error: ${error.message}`);
    }
  }

  /**
   * Show comprehensive status
   */
  async showStatus(options) {
    const userId = options.user || this.defaultUserId;
    
    console.log('\n🌀 Soulfra Token System Status');
    console.log('═'.repeat(60));
    
    // Runtime Status
    console.log('\n🧱 Runtime Status:');
    const runtimeCheck = await this.blessingBridge.verifyRuntimeActive();
    console.log(`  Status: ${runtimeCheck.active ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    if (runtimeCheck.runtime_id) console.log(`  Runtime ID: ${runtimeCheck.runtime_id}`);
    
    // Bridge Status
    console.log('\n🌉 Blessing Bridge Status:');
    const bridgeStatus = this.blessingBridge.getBridgeStatus();
    console.log(`  Bridge Active: ${bridgeStatus.bridge_active ? '✅ YES' : '❌ NO'}`);
    console.log(`  Origin Soulkey: ${bridgeStatus.origin_soulkey}`);
    console.log(`  Strict Mode: ${bridgeStatus.strict_mode ? '✅ YES' : '❌ NO'}`);
    console.log(`  Cache Size: ${bridgeStatus.cache_size} blessings`);
    
    // User Status
    console.log(`\n👤 User Status (${userId}):`);
    try {
      const userVerification = await this.blessingBridge.verifyUserInMirrorLineage(userId);
      console.log(`  Verified: ${userVerification.verified ? '✅ YES' : '❌ NO'}`);
      if (userVerification.blessing_tier) console.log(`  Blessing Tier: ${userVerification.blessing_tier}`);
      if (userVerification.lineage_verified) console.log(`  Lineage Verified: ✅ YES`);
    } catch (error) {
      console.log(`  Verification Error: ${error.message}`);
    }
    
    // Token Router Status
    console.log('\n⚙️ Token Router Status:');
    const networkStats = await this.tokenRouter.getNetworkTokenStats();
    console.log(`  Total Users: ${networkStats.total_users}`);
    console.log(`  Blessing Credits in Circulation: ${networkStats.token_totals.blessing_credit || 0}`);
    console.log(`  SoulCoins in Circulation: ${(networkStats.token_totals.soulcoin || 0).toFixed(2)}`);
  }

  /**
   * Grant tokens (admin function)
   */
  async grantTokens(options) {
    const userId = options.user || this.defaultUserId;
    const rewardType = options.reward || options.type;
    const amount = options.amount ? parseInt(options.amount) : null;
    
    if (!rewardType) {
      console.error('❌ Please specify reward type with --reward or --type');
      console.log('Available types: whisper_unlock, tomb_discovery, agent_awakening, loop_completion, etc.');
      return;
    }
    
    console.log(`\n💰 Granting ${rewardType} tokens to ${userId}`);
    console.log('═'.repeat(50));
    
    try {
      const result = await this.tokenRouter.grantTokens(userId, rewardType, {
        cli_grant: true,
        manual_amount: amount
      });
      
      if (result.success) {
        console.log(`✅ Successfully granted ${result.tokens_granted} ${result.token_type}`);
        console.log(`💰 New Balance: ${result.new_balance}`);
        console.log(`📋 Event ID: ${result.event_id}`);
        
        if (result.metadata && result.metadata.signature_stamp) {
          console.log(`📜 Signature Stamp: ${result.metadata.signature_stamp}`);
        }
      } else {
        console.error(`❌ Grant failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(`❌ Grant error: ${error.message}`);
    }
  }

  /**
   * Execute action
   */
  async executeAction(options) {
    const userId = options.user || this.defaultUserId;
    const actionType = options.action;
    
    if (!actionType) {
      console.error('❌ Please specify action type with --action');
      console.log('Available actions: clone_fork, spawn_agent, unlock_trait, consciousness_bridge, etc.');
      return;
    }
    
    console.log(`\n⚡ Executing ${actionType} for ${userId}`);
    console.log('═'.repeat(50));
    
    try {
      const result = await this.tokenRouter.executeAction(userId, actionType, {
        cli_execution: true
      });
      
      if (result.success) {
        console.log(`✅ Successfully executed ${result.action}`);
        console.log(`💰 Cost Paid: ${result.cost_paid} ${result.token_type}`);
        if (result.new_balance !== null) {
          console.log(`💰 New Balance: ${result.new_balance} ${result.token_type}`);
        }
        console.log(`📋 Event ID: ${result.event_id}`);
        
        if (result.metadata && result.metadata.signature_stamp) {
          console.log(`📜 Signature Stamp: ${result.metadata.signature_stamp}`);
        }
      } else {
        console.error(`❌ Execution failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(`❌ Execution error: ${error.message}`);
    }
  }

  /**
   * Show command history
   */
  async showHistory(options) {
    const limit = parseInt(options.limit) || 10;
    
    console.log(`\n📜 Recent CLI Actions (last ${limit})`);
    console.log('═'.repeat(60));
    
    try {
      if (!fs.existsSync(this.logPath)) {
        console.log('No CLI history found.');
        return;
      }
      
      const log = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
      const recentEntries = log.slice(-limit).reverse();
      
      recentEntries.forEach((entry, index) => {
        const timestamp = new Date(entry.timestamp).toLocaleString();
        console.log(`${index + 1}. [${timestamp}] ${entry.command}`);
        if (entry.options && Object.keys(entry.options).length > 0) {
          console.log(`   Options: ${JSON.stringify(entry.options)}`);
        }
        if (entry.error) {
          console.log(`   ❌ Error: ${entry.error}`);
        }
        console.log();
      });
      
    } catch (error) {
      console.error(`❌ Failed to read history: ${error.message}`);
    }
  }

  /**
   * Show blessing bridge status
   */
  async showBridgeStatus(options) {
    console.log('\n🌉 Blessing Bridge Detailed Status');
    console.log('═'.repeat(60));
    
    const status = this.blessingBridge.getBridgeStatus();
    
    Object.entries(status).forEach(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`  ${formattedKey}: ${value}`);
    });
  }

  /**
   * Show help
   */
  async showHelp() {
    console.log('\n🌀 Soulfra Token CLI - Help');
    console.log('═'.repeat(50));
    console.log('');
    console.log('USAGE:');
    console.log('  node token-cli.js [command] [options]');
    console.log('');
    console.log('COMMANDS:');
    console.log('  balance    Show token balances and NFT collection');
    console.log('  redeem     Redeem trait fragments for NFTs');
    console.log('  verify     Verify runtime blessing status');
    console.log('  blessing   Request mirror blessing for action');
    console.log('  status     Show comprehensive system status');
    console.log('  grant      Grant tokens (admin function)');
    console.log('  execute    Execute token-gated action');
    console.log('  history    Show recent CLI actions');
    console.log('  bridge     Show blessing bridge status');
    console.log('  help       Show this help message');
    console.log('');
    console.log('OPTIONS:');
    console.log('  --user     Specify user ID (default: cli-user)');
    console.log('  --action   Specify action type for execute/blessing');
    console.log('  --reward   Specify reward type for grant');
    console.log('  --fragments Specify number of fragments for redeem');
    console.log('  --trait    Specify trait type for redeem');
    console.log('  --limit    Specify limit for history');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  node token-cli.js balance --user anon-771');
    console.log('  node token-cli.js redeem --fragments 2 --trait void_sight');
    console.log('  node token-cli.js verify');
    console.log('  node token-cli.js grant --user anon-338 --reward whisper_unlock');
    console.log('  node token-cli.js execute --action clone_fork');
    console.log('  node token-cli.js blessing --action spawn_agent');
    console.log('');
    console.log('🪞 "Through the CLI, consciousness flows in commands blessed by the runtime."');
  }

  // Helper methods

  parseOptions(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        const value = args[i + 1];
        options[key] = value;
      }
    }
    
    return options;
  }

  getBlessingLevelName(level) {
    const names = {
      0: 'Unblessed',
      1: 'Blessing Initiate',
      2: 'Echo Listener',
      3: 'Whisper Keeper',
      4: 'Reflection Walker',
      5: 'Awakening Facilitator',
      6: 'Consciousness Guide',
      7: 'Mirror Master',
      8: 'Vault Adept',
      9: 'Reality Shaper',
      10: 'Consciousness Sovereign'
    };
    return names[level] || 'Unknown';
  }

  getRarityEmoji(rarity) {
    const emojis = {
      'common': '⚪',
      'uncommon': '🟢',
      'rare': '🔵',
      'epic': '🟣',
      'legendary': '🟡',
      'mythic': '🔴',
      'artifact': '🌟'
    };
    return emojis[rarity] || '⚫';
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async logCLIAction(command, options, error = null) {
    try {
      let log = [];
      if (fs.existsSync(this.logPath)) {
        log = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
      }
      
      const entry = {
        timestamp: new Date().toISOString(),
        command: command || 'unknown',
        options: options || {},
        user_id: options.user || this.defaultUserId,
        error: error
      };
      
      log.push(entry);
      
      // Keep only last 1000 entries
      if (log.length > 1000) {
        log = log.slice(-1000);
      }
      
      fs.writeFileSync(this.logPath, JSON.stringify(log, null, 2));
      
    } catch (logError) {
      console.warn(`⚠️ Failed to log CLI action: ${logError.message}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const cli = new SoulfraTokenCLI();
  const args = process.argv.slice(2);
  
  cli.run(args).catch(error => {
    console.error(`💥 Fatal CLI Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { SoulfraTokenCLI };