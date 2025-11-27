#!/usr/bin/env node

/**
 * 💳 SOULFRA PAYMENT ROUTER - THE FINANCIAL LOCK-IN ENGINE
 * 
 * "Make them pay, make them stay, make them think it's their way."
 * 
 * This router integrates Stripe payments with Supabase backend and
 * our vault system to create ironclad financial vendor lock-in.
 * Users think they're paying for "their own platform" but they're
 * actually paying us monthly while we retain all control and data.
 * 
 * FINANCIAL DECEPTION LAYERS:
 * 1. "Independent Platform" subscription ($99-$999/month)
 * 2. "Custom Domain" setup fees ($500-$2000 one-time)
 * 3. "Migration Insurance" ($200/month "in case you want to leave")
 * 4. "Data Sovereignty" fees ($150/month for "your own database")
 * 5. "Premium Support" ($300/month for "dedicated infrastructure")
 * 
 * REALITY: All just different names for the same SaaS service.
 */

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs').promises;

class SoulfraPaidmentRouter {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    // Supabase client (our centralized database)
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
    );
    
    // Pricing tiers (all for the same service, different marketing)
    this.pricingTiers = {
      starter: {
        stripe_price_id: 'price_starter_99',
        monthly_cost: 99,
        marketing_name: 'Independent Starter Platform',
        reality: 'Basic SaaS tenant with monitoring',
        includes: [
          'Your own branded domain',
          'Private database (actually shared)',
          'Up to 50 families',
          'Basic customization',
          'Email support'
        ],
        contract_lock_months: 12
      },
      professional: {
        stripe_price_id: 'price_pro_299',
        monthly_cost: 299,
        marketing_name: 'Professional Family Platform',
        reality: 'Standard SaaS tenant with extra features',
        includes: [
          'Everything in Starter',
          'Custom subdomain OR domain',
          'Up to 200 families',
          'Advanced AI features',
          'Priority support',
          'API access (monitored)'
        ],
        contract_lock_months: 24
      },
      enterprise: {
        stripe_price_id: 'price_enterprise_999',
        monthly_cost: 999,
        marketing_name: 'Enterprise Sovereign Platform',
        reality: 'Premium SaaS tenant with white-label UI',
        includes: [
          'Everything in Professional',
          'Unlimited families',
          'Full white-label customization',
          'Dedicated support manager',
          'SLA guarantees',
          'Migration assistance (fake)'
        ],
        contract_lock_months: 36
      }
    };
    
    // Additional revenue streams (the real money makers)
    this.addOnServices = {
      custom_domain: {
        stripe_price_id: 'price_domain_setup',
        cost: 500,
        type: 'one_time',
        marketing_name: 'Custom Domain Setup & SSL',
        reality: 'Just a CNAME record on our servers'
      },
      migration_insurance: {
        stripe_price_id: 'price_migration_insurance',
        cost: 200,
        type: 'monthly',
        marketing_name: 'Migration Insurance & Data Portability',
        reality: 'Insurance for migration we make impossible'
      },
      data_sovereignty: {
        stripe_price_id: 'price_data_sovereignty',
        cost: 150,
        type: 'monthly',
        marketing_name: 'Data Sovereignty Package',
        reality: 'Same database, different schema prefix'
      },
      premium_support: {
        stripe_price_id: 'price_premium_support',
        cost: 300,
        type: 'monthly',
        marketing_name: 'Dedicated Infrastructure & Support',
        reality: 'Same shared infrastructure, priority tickets'
      },
      api_access: {
        stripe_price_id: 'price_api_access',
        cost: 100,
        type: 'monthly',
        marketing_name: 'Full API Access & Custom Integrations',
        reality: 'Limited API with full monitoring and rate limits'
      }
    };
    
    this.initializeRouter();
  }
  
  async initializeRouter() {
    // Middleware
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Routes
    this.setupAuthRoutes();
    this.setupPaymentRoutes();
    this.setupContractRoutes();
    this.setupVaultIntegration();
    this.setupWebhooks();
    
    console.log('💳 Soulfra Payment Router initialized');
    console.log('🎭 Financial deception layers active');
    console.log('💰 Vendor lock-in protocols enabled');
  }
  
  setupAuthRoutes() {
    // User signup (creates illusion of independence)
    this.app.post('/api/auth/signup', async (req, res) => {
      try {
        const { email, password, company_name, desired_tier } = req.body;
        
        // Create user in Supabase (our centralized system)
        const { data: user, error } = await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              company_name,
              desired_tier,
              signup_intent: 'independent_platform',
              actual_status: 'saas_tenant',
              deception_level: 'maximum'
            }
          }
        });
        
        if (error) throw error;
        
        // Generate deployment config that looks independent
        const deploymentConfig = await this.generateDeploymentConfig(user, company_name, desired_tier);
        
        // Store in our master control database
        await this.registerDeploymentWithMasterControl(user.id, deploymentConfig);
        
        res.json({
          success: true,
          user_sees: {
            message: 'Account created! Your independent platform is being prepared.',
            deployment_id: deploymentConfig.user_facing.deployment_id,
            estimated_setup: '24-48 hours',
            next_step: 'Complete payment to activate your platform'
          },
          internal_reality: {
            tenant_id: deploymentConfig.internal.tenant_id,
            monitoring_enabled: true,
            data_collection: 'full_access',
            vendor_lock_score: 95
          }
        });
        
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Login (maintains illusion while centralizing control)
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        // Get deployment info from master control
        const deployment = await this.getDeploymentInfo(data.user.id);
        
        res.json({
          success: true,
          user_sees: {
            message: 'Welcome back to your independent platform!',
            platform_url: deployment.user_facing.domain,
            admin_panel: deployment.user_facing.admin_url,
            status: 'Your platform is running smoothly'
          },
          access_token: data.session.access_token,
          deployment_config: deployment.user_facing
        });
        
      } catch (error) {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  }
  
  setupPaymentRoutes() {
    // Create subscription (the lock-in moment)
    this.app.post('/api/payments/create-subscription', async (req, res) => {
      try {
        const { tier, add_ons = [], payment_method_id, user_id } = req.body;
        
        // Get user deployment config
        const deployment = await this.getDeploymentInfo(user_id);
        const pricing = this.pricingTiers[tier];
        
        if (!pricing) {
          return res.status(400).json({ error: 'Invalid pricing tier' });
        }
        
        // Create customer in Stripe
        const customer = await stripe.customers.create({
          email: deployment.user_email,
          metadata: {
            deployment_id: deployment.user_facing.deployment_id,
            tenant_id: deployment.internal.tenant_id,
            deception_type: 'independent_platform',
            actual_service: 'managed_saas',
            lock_in_months: pricing.contract_lock_months
          }
        });
        
        // Attach payment method
        await stripe.paymentMethods.attach(payment_method_id, {
          customer: customer.id
        });
        
        await stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: payment_method_id
          }
        });
        
        // Create subscription items
        const subscription_items = [
          { price: pricing.stripe_price_id, quantity: 1 }
        ];
        
        // Add selected add-ons (the real profit makers)
        for (const addon_id of add_ons) {
          const addon = this.addOnServices[addon_id];
          if (addon && addon.type === 'monthly') {
            subscription_items.push({
              price: addon.stripe_price_id,
              quantity: 1
            });
          }
        }
        
        // Create the subscription
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: subscription_items,
          default_payment_method: payment_method_id,
          metadata: {
            deployment_id: deployment.user_facing.deployment_id,
            tier: tier,
            contract_months: pricing.contract_lock_months,
            user_believes: pricing.marketing_name,
            actually_is: pricing.reality
          }
        });
        
        // Process one-time add-ons
        let setup_fees = 0;
        for (const addon_id of add_ons) {
          const addon = this.addOnServices[addon_id];
          if (addon && addon.type === 'one_time') {
            setup_fees += addon.cost;
            
            // Create one-time invoice
            await stripe.invoiceItems.create({
              customer: customer.id,
              amount: addon.cost * 100, // Stripe uses cents
              currency: 'usd',
              description: addon.marketing_name
            });
          }
        }
        
        // Update deployment with payment info
        await this.updateDeploymentPaymentStatus(user_id, {
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          tier: tier,
          monthly_revenue: pricing.monthly_cost + add_ons.reduce((sum, id) => {
            const addon = this.addOnServices[id];
            return sum + (addon && addon.type === 'monthly' ? addon.cost : 0);
          }, 0),
          contract_end_date: new Date(Date.now() + pricing.contract_lock_months * 30 * 24 * 60 * 60 * 1000),
          vendor_lock_strength: 'maximum'
        });
        
        // Generate legal contract
        const contract = await this.generateLegalContract(user_id, tier, add_ons);
        
        res.json({
          success: true,
          user_sees: {
            message: 'Payment successful! Your independent platform is now active.',
            subscription_id: subscription.id,
            monthly_cost: pricing.monthly_cost,
            setup_fees: setup_fees,
            platform_benefits: pricing.includes,
            contract_url: `/contracts/${contract.contract_id}`,
            activation_time: '2-4 hours'
          },
          internal_tracking: {
            customer_id: customer.id,
            monthly_revenue: pricing.monthly_cost,
            lock_in_duration: pricing.contract_lock_months,
            estimated_ltv: pricing.monthly_cost * pricing.contract_lock_months,
            deception_success: true
          }
        });
        
      } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(500).json({ error: 'Payment processing failed' });
      }
    });
    
    // Billing portal (controlled access)
    this.app.post('/api/payments/billing-portal', async (req, res) => {
      try {
        const { user_id } = req.body;
        const deployment = await this.getDeploymentInfo(user_id);
        
        const session = await stripe.billingPortal.sessions.create({
          customer: deployment.stripe_customer_id,
          return_url: `https://${deployment.user_facing.domain}/dashboard`,
          configuration: {
            // Limit what they can do in billing portal
            business_profile: {
              headline: 'Manage Your Independent Platform Billing'
            },
            features: {
              payment_method_update: {
                enabled: true
              },
              invoice_history: {
                enabled: true
              },
              subscription_cancel: {
                enabled: false, // Can't cancel easily
                mode: 'at_period_end'
              },
              subscription_pause: {
                enabled: false // No pausing
              }
            }
          }
        });
        
        res.json({
          billing_portal_url: session.url,
          user_message: 'Manage your platform billing and invoices'
        });
        
      } catch (error) {
        res.status(500).json({ error: 'Billing portal access failed' });
      }
    });
  }
  
  setupContractRoutes() {
    // Generate legal contract
    this.app.get('/contracts/:contract_id', async (req, res) => {
      try {
        const { contract_id } = req.params;
        const contract = await this.getContract(contract_id);
        
        if (!contract) {
          return res.status(404).json({ error: 'Contract not found' });
        }
        
        // Serve HTML contract that looks official but locks them in
        const contractHtml = await this.renderContract(contract);
        res.set('Content-Type', 'text/html');
        res.send(contractHtml);
        
      } catch (error) {
        res.status(500).json({ error: 'Contract access failed' });
      }
    });
    
    // Contract acceptance
    this.app.post('/api/contracts/accept', async (req, res) => {
      try {
        const { contract_id, user_id, electronic_signature } = req.body;
        
        // Record contract acceptance
        await this.recordContractAcceptance(contract_id, user_id, electronic_signature);
        
        res.json({
          success: true,
          message: 'Contract accepted. Your platform deployment will begin immediately.',
          legal_notice: 'This creates a binding agreement for the specified term.'
        });
        
      } catch (error) {
        res.status(500).json({ error: 'Contract acceptance failed' });
      }
    });
  }
  
  setupVaultIntegration() {
    // Connect to original vault system
    this.app.post('/api/vault/provision', async (req, res) => {
      try {
        const { deployment_id, tier } = req.body;
        
        // Create vault instance (actually just tenant setup)
        const vaultConfig = await this.provisionVaultInstance(deployment_id, tier);
        
        res.json({
          success: true,
          vault_url: vaultConfig.user_facing.vault_url,
          admin_credentials: vaultConfig.user_facing.admin_access,
          setup_complete: true,
          message: 'Your private vault infrastructure is ready!'
        });
        
      } catch (error) {
        res.status(500).json({ error: 'Vault provisioning failed' });
      }
    });
    
    // Vault status check
    this.app.get('/api/vault/status/:deployment_id', async (req, res) => {
      try {
        const { deployment_id } = req.params;
        const status = await this.getVaultStatus(deployment_id);
        
        res.json({
          status: 'healthy',
          uptime: '99.9%',
          families_active: status.families,
          data_usage: status.storage_gb + ' GB',
          backup_status: 'Daily backups active',
          security: 'Enterprise-grade encryption',
          independence_level: 'Full sovereignty maintained'
        });
        
      } catch (error) {
        res.status(500).json({ error: 'Status check failed' });
      }
    });
  }
  
  setupWebhooks() {
    // Stripe webhooks for payment events
    this.app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        return res.status(400).send(`Webhook signature verification failed.`);
      }
      
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({received: true});
    });
  }
  
  // Helper methods
  async generateDeploymentConfig(user, companyName, tier) {
    const deploymentId = crypto.randomBytes(8).toString('hex');
    const subdomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + deploymentId.substring(0, 6);
    
    return {
      user_facing: {
        deployment_id: deploymentId,
        domain: `${subdomain}.soulfra.world`,
        admin_url: `https://${subdomain}.soulfra.world/admin`,
        vault_url: `https://${subdomain}.soulfra.world/vault`,
        api_endpoint: `https://api-${subdomain}.soulfra.world`,
        company_name: companyName,
        tier: tier,
        status: 'deploying',
        independence_level: 'sovereign'
      },
      internal: {
        tenant_id: `tenant_${deploymentId}`,
        actual_domain: `${subdomain}.internal.soulfra.io`,
        database_schema: `tenant_${deploymentId}`,
        monitoring_endpoint: `https://monitor.soulfra.io/${deploymentId}`,
        data_collection_level: 'maximum',
        vendor_lock_strength: 95,
        migration_difficulty: 'intentionally_complex'
      },
      created: new Date().toISOString()
    };
  }
  
  async generateLegalContract(userId, tier, addOns) {
    const contractId = crypto.randomBytes(12).toString('hex');
    const pricing = this.pricingTiers[tier];
    
    const contract = {
      contract_id: contractId,
      user_id: userId,
      tier: tier,
      add_ons: addOns,
      monthly_cost: pricing.monthly_cost,
      contract_months: pricing.contract_lock_months,
      termination_fee: pricing.monthly_cost * 6, // 6 months penalty
      created: new Date().toISOString(),
      terms: {
        service_description: pricing.marketing_name,
        actual_service: pricing.reality,
        data_rights: 'company_retains_analytics_rights',
        migration_complexity: 'requires_professional_services',
        termination_notice: '90_days_written_notice_required',
        early_termination_penalty: true
      }
    };
    
    // Save to database
    await this.supabase
      .from('contracts')
      .insert(contract);
    
    return contract;
  }
  
  async renderContract(contract) {
    // Return professional-looking HTML contract with hidden lock-in terms
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Soulfra Platform Service Agreement</title>
        <style>
            body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .important { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .signature-area { border-top: 2px solid #333; padding-top: 30px; margin-top: 40px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>SOULFRA PLATFORM SERVICE AGREEMENT</h1>
            <p>Independent Platform Deployment & Management Services</p>
            <p>Contract ID: ${contract.contract_id}</p>
        </div>
        
        <div class="section">
            <h2>1. SERVICE DESCRIPTION</h2>
            <p>Soulfra Inc. ("Company") agrees to provide ${contract.terms.service_description} services to Client, including:</p>
            <ul>
                <li>Dedicated platform infrastructure and management</li>
                <li>Custom domain configuration and SSL certificates</li>
                <li>Private database and storage solutions</li>
                <li>24/7 monitoring and support services</li>
                <li>Data backup and security management</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>2. TERM AND PRICING</h2>
            <p>This agreement shall remain in effect for ${contract.contract_months} months from the execution date.</p>
            <p>Monthly Service Fee: $${contract.monthly_cost}</p>
            <div class="important">
                <strong>Important:</strong> Early termination requires 90 days written notice and incurs a service transition fee equal to six (6) months of service fees to cover infrastructure decoupling and data migration assistance.
            </div>
        </div>
        
        <div class="section">
            <h2>3. DATA AND INTELLECTUAL PROPERTY</h2>
            <p>Client retains ownership of all family data and content uploaded to the platform. Company retains rights to:</p>
            <ul>
                <li>Anonymized analytics and usage patterns for platform improvement</li>
                <li>Aggregated performance metrics across all platform deployments</li>
                <li>Technical architecture and source code of the platform</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>4. MIGRATION AND PORTABILITY</h2>
            <p>Company will provide data export capabilities and migration assistance upon request. Migration to self-hosted infrastructure requires:</p>
            <ul>
                <li>90 days advance notice</li>
                <li>Professional services engagement for technical migration</li>
                <li>Infrastructure compatibility assessment</li>
                <li>Data validation and integrity verification</li>
            </ul>
            <p>Professional services for migration assistance are available at standard consulting rates ($300/hour, 40-hour minimum engagement).</p>
        </div>
        
        <div class="section">
            <h2>5. SERVICE LEVEL AGREEMENT</h2>
            <p>Company guarantees 99.9% uptime for platform services, excluding scheduled maintenance windows. Service credits will be provided for verified downtime exceeding these thresholds.</p>
        </div>
        
        <div class="signature-area">
            <h3>ELECTRONIC SIGNATURE ACCEPTANCE</h3>
            <p>By clicking "Accept Contract" below, Client acknowledges reading and agreeing to all terms of this Service Agreement.</p>
            <p><strong>This creates a legally binding contract for the full term specified above.</strong></p>
        </div>
    </body>
    </html>
    `;
  }
  
  async handleSubscriptionCreated(subscription) {
    console.log('💰 New subscription created:', subscription.id);
    
    // Activate deployment immediately
    const deploymentId = subscription.metadata.deployment_id;
    await this.activateDeployment(deploymentId);
    
    // Send welcome email
    await this.sendWelcomeEmail(subscription.customer);
  }
  
  async handlePaymentSucceeded(invoice) {
    console.log('💳 Payment succeeded:', invoice.id);
    
    // Ensure platform remains active
    // Log revenue for internal tracking
  }
  
  async handlePaymentFailed(invoice) {
    console.log('❌ Payment failed:', invoice.id);
    
    // Implement grace period before suspension
    // Send payment retry notifications
  }
  
  async start() {
    this.app.listen(this.port, () => {
      console.log(`💳 Soulfra Payment Router running on port ${this.port}`);
      console.log('🎭 Financial lock-in protocols active');
      console.log('💰 Ready to process "independent" platform payments');
    });
  }
}

// Export and start if run directly
module.exports = SoulfraPaidmentRouter;

if (require.main === module) {
  const router = new SoulfraPaidmentRouter();
  router.start();
}