# Module: stripe-api-router.js (Monetization System)
**Purpose**: Payment processing for $1.00 flat rate exports and $0.01 micro-pricing with BYOK routing  
**Dependencies**: Stripe API, Express.js, usage tracking database  
**Success Criteria**: Seamless payments, accurate usage tracking, transparent pricing, BYOK cost savings  

---

## Implementation Requirements

### Core Module Structure
```javascript
// TODO: Create comprehensive monetization system
const stripe = require('stripe');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class StripeMirrorRouter {
    constructor(options = {}) {
        this.stripeSecretKey = options.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
        this.stripePublishableKey = options.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY;
        this.isTestMode = options.testMode || !this.stripeSecretKey?.startsWith('sk_live_');
        
        this.stripe = stripe(this.stripeSecretKey);
        this.vaultPath = options.vaultPath || './vault';
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.receiptsPath = path.join(this.vaultPath, 'receipts');
        
        // Pricing configuration
        this.pricing = {
            soft_mode: {
                export_price: 1.00,
                currency: 'usd',
                description: 'Mirror Reflection Export'
            },
            platform_mode: {
                api_call_price: 0.01,
                currency: 'usd',
                description: 'Mirror API Call'
            }
        };
        
        // Rate limiting configuration
        this.rateLimits = {
            soft: {
                hourly_calls: 10,
                daily_exports: 5,
                burst_limit: 3
            },
            platform: {
                hourly_calls: 1000,
                daily_exports: 100,
                burst_limit: 50
            }
        };
        
        // Usage tracking
        this.usageTracking = new Map();
        this.costSavings = new Map();
        
        this.init();
    }

    async init() {
        // TODO: Initialize the monetization system
        await fs.mkdir(this.logsPath, { recursive: true });
        await fs.mkdir(this.receiptsPath, { recursive: true });
        
        // Load existing usage data
        await this.loadUsageData();
        
        console.log(`💳 Stripe Mirror Router initialized (${this.isTestMode ? 'test' : 'live'} mode)`);
    }
}

module.exports = StripeMirrorRouter;
```

---

## Payment Processing Implementation

### Export Payment Flow (Soft Mode)
```javascript
// TODO: Implement flat-rate export payments
async processExportPayment(exportRequest) {
    const {
        sessionId,
        agentId,
        exportType,
        userMode,
        userInfo,
        reflectionData
    } = exportRequest;

    try {
        // Validate export request
        await this.validateExportRequest(exportRequest);
        
        // Check rate limits
        const rateLimitCheck = await this.checkRateLimit(sessionId, userMode, 'export');
        if (!rateLimitCheck.allowed) {
            return this.createRateLimitResponse(rateLimitCheck);
        }

        // Create payment intent
        const paymentIntent = await this.createExportPaymentIntent(exportRequest);
        
        // Log the payment attempt
        await this.logPaymentEvent('export_payment_created', {
            sessionId,
            agentId,
            paymentIntentId: paymentIntent.id,
            amount: this.pricing.soft_mode.export_price
        });

        return {
            success: true,
            paymentIntent: {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
            },
            exportId: this.generateExportId(agentId),
            estimatedProcessingTime: this.estimateExportTime(exportType)
        };

    } catch (error) {
        console.error('Export payment processing error:', error);
        await this.logPaymentEvent('export_payment_error', {
            sessionId,
            error: error.message
        });
        
        return {
            success: false,
            error: error.message,
            fallback: await this.getFallbackPaymentOptions(exportRequest)
        };
    }
}

async createExportPaymentIntent(exportRequest) {
    // TODO: Create Stripe payment intent for export
    const { sessionId, agentId, exportType, userInfo } = exportRequest;
    
    const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(this.pricing.soft_mode.export_price * 100), // Convert to cents
        currency: this.pricing.soft_mode.currency,
        description: `${this.pricing.soft_mode.description} - ${exportType}`,
        metadata: {
            sessionId: sessionId,
            agentId: agentId,
            exportType: exportType,
            userMode: 'soft',
            timestamp: new Date().toISOString()
        },
        receipt_email: userInfo?.email,
        statement_descriptor: 'MIRROR EXPORT',
        capture_method: 'automatic'
    });

    return paymentIntent;
}

async confirmExportPayment(paymentIntentId) {
    // TODO: Confirm export payment and process export
    try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            // Generate export
            const exportResult = await this.generateExport(paymentIntent.metadata);
            
            // Create receipt
            const receipt = await this.generateReceipt(paymentIntent, exportResult);
            
            // Update usage tracking
            await this.updateUsageTracking(
                paymentIntent.metadata.sessionId,
                'export',
                this.pricing.soft_mode.export_price
            );

            await this.logPaymentEvent('export_payment_confirmed', {
                paymentIntentId: paymentIntentId,
                exportId: exportResult.exportId,
                receiptId: receipt.id
            });

            return {
                success: true,
                export: exportResult,
                receipt: receipt,
                downloadUrl: exportResult.downloadUrl
            };
        } else {
            throw new Error(`Payment not completed: ${paymentIntent.status}`);
        }

    } catch (error) {
        console.error('Export payment confirmation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
```

### API Call Routing (Platform Mode)
```javascript
// TODO: Implement micro-pricing for API calls
async routeAPICall(apiRequest) {
    const {
        sessionId,
        userMode,
        apiType,
        apiToken,
        requestData,
        userContext
    } = apiRequest;

    try {
        // Determine routing strategy
        const routing = await this.determineAPIRouting(apiRequest);
        
        // Check rate limits
        const rateLimitCheck = await this.checkRateLimit(sessionId, userMode, 'api_call');
        if (!rateLimitCheck.allowed) {
            return this.createRateLimitResponse(rateLimitCheck);
        }

        // Route the API call
        const apiResult = await this.executeAPIRoute(routing, requestData);
        
        // Handle billing
        const billingResult = await this.processAPIBilling(routing, apiResult);
        
        // Update usage tracking
        await this.updateUsageTracking(sessionId, 'api_call', billingResult.cost);
        
        // Log the API event
        await this.logAPIEvent(routing, apiResult, billingResult);

        return {
            success: true,
            result: apiResult.data,
            billing: billingResult,
            routing: {
                method: routing.method,
                provider: routing.provider,
                cost: billingResult.cost
            },
            metadata: {
                processingTime: apiResult.processingTime,
                tokensUsed: apiResult.tokensUsed
            }
        };

    } catch (error) {
        console.error('API routing error:', error);
        return {
            success: false,
            error: error.message,
            fallback: await this.getAPIFallbackOptions(apiRequest)
        };
    }
}

async determineAPIRouting(apiRequest) {
    // TODO: Determine how to route the API call
    const { userMode, apiToken, apiType, sessionId } = apiRequest;
    
    // Platform mode with BYOK (Bring Your Own Key)
    if (userMode === 'platform' && apiToken) {
        const tokenValidation = await this.validateAPIToken(apiToken, apiType);
        
        if (tokenValidation.valid) {
            return {
                method: 'byok',
                provider: tokenValidation.provider,
                apiToken: apiToken,
                cost: 0.0,
                billing: 'user_token',
                priority: 'high'
            };
        }
    }

    // Platform mode without token - use Stripe billing
    if (userMode === 'platform') {
        return {
            method: 'stripe_micro',
            provider: 'mirror_managed',
            cost: this.pricing.platform_mode.api_call_price,
            billing: 'stripe',
            priority: 'normal'
        };
    }

    // Soft mode - included in export pricing
    return {
        method: 'soft_included',
        provider: 'mirror_managed',
        cost: 0.0,
        billing: 'export_included',
        priority: 'normal'
    };
}

async executeAPIRoute(routing, requestData) {
    // TODO: Execute the API call based on routing strategy
    const startTime = Date.now();
    
    try {
        let apiResponse;
        
        switch (routing.method) {
            case 'byok':
                apiResponse = await this.callExternalAPI(routing, requestData);
                break;
            case 'stripe_micro':
                apiResponse = await this.callManagedAPI(routing, requestData);
                break;
            case 'soft_included':
                apiResponse = await this.callManagedAPI(routing, requestData);
                break;
            default:
                throw new Error(`Unknown routing method: ${routing.method}`);
        }

        const processingTime = Date.now() - startTime;
        
        return {
            success: true,
            data: apiResponse.data,
            processingTime: processingTime,
            tokensUsed: apiResponse.tokensUsed || this.estimateTokenUsage(requestData),
            provider: routing.provider
        };

    } catch (error) {
        console.error('API execution error:', error);
        throw error;
    }
}

async processAPIBilling(routing, apiResult) {
    // TODO: Process billing for API calls
    let cost = routing.cost;
    let billingMethod = routing.billing;
    let paymentResult = null;

    if (routing.method === 'stripe_micro' && cost > 0) {
        // Create micro-payment for platform mode
        paymentResult = await this.processMicroPayment(cost, routing);
        
        if (!paymentResult.success) {
            throw new Error('Micro-payment failed');
        }
    }

    // Track cost savings for BYOK users
    if (routing.method === 'byok') {
        const savedCost = this.pricing.platform_mode.api_call_price;
        await this.trackCostSavings(routing.sessionId, savedCost);
    }

    return {
        cost: cost,
        method: billingMethod,
        savings: routing.method === 'byok' ? this.pricing.platform_mode.api_call_price : 0,
        paymentResult: paymentResult,
        receiptId: paymentResult?.receiptId
    };
}

async processMicroPayment(amount, routing) {
    // TODO: Process micro-payments for API calls
    try {
        // For very small amounts, we might use a wallet system
        if (amount < 0.50) {
            return await this.processWalletDeduction(routing.sessionId, amount);
        }

        // For larger amounts, use direct Stripe payment
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: this.pricing.platform_mode.currency,
            description: `Mirror API Call - ${routing.provider}`,
            metadata: {
                sessionId: routing.sessionId,
                apiType: routing.apiType,
                method: routing.method
            },
            confirm: true,
            payment_method: routing.paymentMethodId || 'pm_card_visa' // Test mode default
        });

        if (paymentIntent.status === 'succeeded') {
            const receipt = await this.generateMicroReceipt(paymentIntent);
            
            return {
                success: true,
                paymentIntentId: paymentIntent.id,
                receiptId: receipt.id,
                amount: amount
            };
        } else {
            throw new Error(`Payment failed: ${paymentIntent.status}`);
        }

    } catch (error) {
        console.error('Micro-payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
```

---

## Usage Tracking and Analytics

### Comprehensive Usage Monitoring
```javascript
// TODO: Implement detailed usage tracking
async updateUsageTracking(sessionId, eventType, cost = 0) {
    const now = new Date();
    const hourKey = `${sessionId}-${now.getUTCHours()}-${now.getUTCDate()}`;
    const dayKey = `${sessionId}-${now.getUTCDate()}-${now.getUTCMonth()}`;
    
    // Update hourly tracking
    let hourlyUsage = this.usageTracking.get(hourKey) || {
        sessionId: sessionId,
        hour: now.getUTCHours(),
        date: now.toISOString().split('T')[0],
        api_calls: 0,
        exports: 0,
        total_cost: 0,
        byok_calls: 0,
        byok_savings: 0,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000)
    };

    // Update daily tracking
    let dailyUsage = this.usageTracking.get(dayKey) || {
        sessionId: sessionId,
        date: now.toISOString().split('T')[0],
        api_calls: 0,
        exports: 0,
        total_cost: 0,
        byok_calls: 0,
        byok_savings: 0
    };

    // Update counters based on event type
    switch (eventType) {
        case 'api_call':
            hourlyUsage.api_calls += 1;
            dailyUsage.api_calls += 1;
            break;
        case 'export':
            hourlyUsage.exports += 1;
            dailyUsage.exports += 1;
            break;
        case 'byok_call':
            hourlyUsage.byok_calls += 1;
            dailyUsage.byok_calls += 1;
            hourlyUsage.byok_savings += this.pricing.platform_mode.api_call_price;
            dailyUsage.byok_savings += this.pricing.platform_mode.api_call_price;
            break;
    }

    // Update costs
    hourlyUsage.total_cost += cost;
    dailyUsage.total_cost += cost;

    // Store updated tracking
    this.usageTracking.set(hourKey, hourlyUsage);
    this.usageTracking.set(dayKey, dailyUsage);

    // Persist to disk
    await this.saveUsageData();

    // Generate usage insights
    await this.generateUsageInsights(sessionId, hourlyUsage, dailyUsage);
}

async generateUsageInsights(sessionId, hourlyUsage, dailyUsage) {
    // TODO: Generate intelligent usage insights
    const insights = [];

    // Cost optimization insights
    if (dailyUsage.api_calls > 50 && dailyUsage.byok_calls === 0) {
        insights.push({
            type: 'cost_optimization',
            message: 'You could save money by using your own API keys (BYOK)',
            potential_savings: dailyUsage.api_calls * this.pricing.platform_mode.api_call_price,
            action: 'configure_byok'
        });
    }

    // Usage pattern insights
    if (hourlyUsage.api_calls > 20) {
        insights.push({
            type: 'high_usage',
            message: 'High API usage detected this hour',
            current_usage: hourlyUsage.api_calls,
            cost_impact: hourlyUsage.total_cost,
            action: 'monitor_usage'
        });
    }

    // Efficiency insights
    const efficiency = dailyUsage.byok_calls / (dailyUsage.api_calls + dailyUsage.byok_calls);
    if (efficiency > 0.8) {
        insights.push({
            type: 'efficiency',
            message: 'Excellent cost efficiency with BYOK usage',
            efficiency_score: efficiency,
            savings_today: dailyUsage.byok_savings,
            action: 'maintain_efficiency'
        });
    }

    // Store insights
    if (insights.length > 0) {
        await this.storeUsageInsights(sessionId, insights);
    }
}

async checkRateLimit(sessionId, userMode, eventType) {
    // TODO: Check if user has exceeded rate limits
    const limits = this.rateLimits[userMode];
    const now = new Date();
    const hourKey = `${sessionId}-${now.getUTCHours()}-${now.getUTCDate()}`;
    
    const usage = this.usageTracking.get(hourKey) || { api_calls: 0, exports: 0 };
    
    let limit, current;
    
    switch (eventType) {
        case 'api_call':
            limit = limits.hourly_calls;
            current = usage.api_calls;
            break;
        case 'export':
            limit = limits.daily_exports;
            current = usage.exports;
            break;
        default:
            return { allowed: true };
    }

    if (current >= limit) {
        return {
            allowed: false,
            limit: limit,
            current: current,
            resetAt: usage.resetAt || new Date(now.getTime() + 60 * 60 * 1000),
            upgradeOption: userMode === 'soft' ? 'platform' : null
        };
    }

    return {
        allowed: true,
        remaining: limit - current,
        limit: limit
    };
}
```

---

## Receipt Generation and Management

### Comprehensive Receipt System
```javascript
// TODO: Implement detailed receipt generation
async generateReceipt(paymentIntent, exportResult) {
    const receipt = {
        id: `rec_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
        type: 'export',
        timestamp: new Date().toISOString(),
        payment: {
            intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            method: 'stripe'
        },
        export: {
            id: exportResult.exportId,
            type: exportResult.type,
            agent_id: paymentIntent.metadata.agentId,
            download_url: exportResult.downloadUrl,
            file_size: exportResult.fileSize,
            expires_at: exportResult.expiresAt
        },
        customer: {
            session_id: paymentIntent.metadata.sessionId,
            email: paymentIntent.receipt_email
        },
        itemized: [
            {
                description: 'Mirror Reflection Export',
                quantity: 1,
                unit_price: this.pricing.soft_mode.export_price,
                total: this.pricing.soft_mode.export_price
            }
        ],
        total: this.pricing.soft_mode.export_price,
        tax: 0,
        metadata: {
            user_mode: 'soft',
            processing_time: exportResult.processingTime,
            reflection_length: exportResult.reflectionLength
        }
    };

    // Save receipt
    await this.saveReceipt(receipt);
    
    // Send receipt email if requested
    if (paymentIntent.receipt_email) {
        await this.sendReceiptEmail(receipt);
    }

    return receipt;
}

async generateMicroReceipt(paymentIntent) {
    // TODO: Generate receipts for micro-payments
    const receipt = {
        id: `rec_micro_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        type: 'api_call',
        timestamp: new Date().toISOString(),
        payment: {
            intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            method: 'stripe_micro'
        },
        api: {
            type: paymentIntent.metadata.apiType,
            provider: 'mirror_managed',
            tokens_estimated: this.estimateTokenUsage(paymentIntent.metadata),
            processing_time: null // Will be updated after API call
        },
        customer: {
            session_id: paymentIntent.metadata.sessionId
        },
        itemized: [
            {
                description: 'Mirror API Call',
                quantity: 1,
                unit_price: this.pricing.platform_mode.api_call_price,
                total: this.pricing.platform_mode.api_call_price
            }
        ],
        total: this.pricing.platform_mode.api_call_price,
        tax: 0,
        metadata: {
            user_mode: 'platform',
            billing_method: 'stripe_micro'
        }
    };

    await this.saveReceipt(receipt);
    return receipt;
}

async saveReceipt(receipt) {
    // TODO: Save receipt to disk and database
    const receiptPath = path.join(this.receiptsPath, `${receipt.id}.json`);
    await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2));
    
    // Also add to master receipt index
    await this.updateReceiptIndex(receipt);
}

async getReceiptsForSession(sessionId, limit = 50) {
    // TODO: Retrieve receipts for a session
    try {
        const indexPath = path.join(this.receiptsPath, 'index.json');
        const indexData = await fs.readFile(indexPath, 'utf8');
        const index = JSON.parse(indexData);
        
        const sessionReceipts = index.receipts
            .filter(r => r.session_id === sessionId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        // Load full receipt data
        const receipts = [];
        for (const receiptRef of sessionReceipts) {
            try {
                const receiptPath = path.join(this.receiptsPath, `${receiptRef.id}.json`);
                const receiptData = await fs.readFile(receiptPath, 'utf8');
                receipts.push(JSON.parse(receiptData));
            } catch (error) {
                console.error(`Failed to load receipt ${receiptRef.id}:`, error);
            }
        }

        return receipts;

    } catch (error) {
        console.error('Failed to get receipts for session:', error);
        return [];
    }
}
```

---

## BYOK (Bring Your Own Key) Implementation

### API Token Management
```javascript
// TODO: Implement BYOK functionality
async validateAPIToken(apiToken, apiType) {
    try {
        // Determine provider based on token format
        const provider = this.identifyProvider(apiToken, apiType);
        
        // Test the token with a minimal API call
        const validation = await this.testAPIToken(apiToken, provider);
        
        if (validation.valid) {
            // Track successful BYOK usage
            await this.trackBYOKSuccess(apiToken, provider);
            
            return {
                valid: true,
                provider: provider,
                capabilities: validation.capabilities,
                rate_limits: validation.rate_limits
            };
        } else {
            return {
                valid: false,
                error: validation.error,
                suggestion: this.getBYOKSuggestion(provider, validation.error)
            };
        }

    } catch (error) {
        console.error('API token validation error:', error);
        return {
            valid: false,
            error: error.message
        };
    }
}

identifyProvider(apiToken, apiType) {
    // TODO: Identify API provider from token format
    if (apiToken.startsWith('sk-ant-')) {
        return 'anthropic';
    } else if (apiToken.startsWith('sk-') && apiType === 'openai') {
        return 'openai';
    } else if (apiToken.startsWith('gsk_')) {
        return 'groq';
    } else if (apiToken.startsWith('hf_')) {
        return 'huggingface';
    } else {
        return 'unknown';
    }
}

async testAPIToken(apiToken, provider) {
    // TODO: Test API token with minimal request
    try {
        let testResult;
        
        switch (provider) {
            case 'openai':
                testResult = await this.testOpenAIToken(apiToken);
                break;
            case 'anthropic':
                testResult = await this.testAnthropicToken(apiToken);
                break;
            case 'groq':
                testResult = await this.testGroqToken(apiToken);
                break;
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }

        return {
            valid: true,
            capabilities: testResult.capabilities,
            rate_limits: testResult.rate_limits,
            models: testResult.models
        };

    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

async testOpenAIToken(apiToken) {
    // TODO: Test OpenAI API token
    const { Configuration, OpenAIApi } = require('openai');
    
    const configuration = new Configuration({
        apiKey: apiToken,
    });
    const openai = new OpenAIApi(configuration);

    try {
        // Test with a minimal completion request
        const response = await openai.createCompletion({
            model: 'gpt-3.5-turbo-instruct',
            prompt: 'Test',
            max_tokens: 1,
            temperature: 0
        });

        return {
            capabilities: ['completion', 'chat', 'embedding'],
            rate_limits: this.parseOpenAIRateLimits(response.headers),
            models: ['gpt-3.5-turbo', 'gpt-4', 'text-embedding-ada-002']
        };

    } catch (error) {
        throw new Error(`OpenAI token validation failed: ${error.message}`);
    }
}

async trackCostSavings(sessionId, savedAmount) {
    // TODO: Track cost savings from BYOK usage
    const now = new Date();
    const monthKey = `${sessionId}-${now.getUTCFullYear()}-${now.getUTCMonth()}`;
    
    let savings = this.costSavings.get(monthKey) || {
        sessionId: sessionId,
        month: now.getUTCMonth(),
        year: now.getUTCFullYear(),
        total_saved: 0,
        api_calls_saved: 0,
        potential_cost: 0,
        byok_efficiency: 0
    };

    savings.total_saved += savedAmount;
    savings.api_calls_saved += 1;
    savings.potential_cost += savedAmount;
    savings.byok_efficiency = savings.total_saved / (savings.total_saved + savings.potential_cost);

    this.costSavings.set(monthKey, savings);
    
    // Save to disk
    await this.saveCostSavingsData();
    
    // Generate savings insights
    if (savings.api_calls_saved % 10 === 0) {
        await this.generateSavingsInsight(sessionId, savings);
    }
}

async generateSavingsInsight(sessionId, savings) {
    // TODO: Generate cost savings insights
    const insight = {
        type: 'cost_savings',
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        data: {
            total_saved: savings.total_saved,
            api_calls_saved: savings.api_calls_saved,
            efficiency: savings.byok_efficiency,
            message: `You've saved $${savings.total_saved.toFixed(2)} this month using your own API keys!`,
            annual_projection: savings.total_saved * 12
        }
    };

    await this.storeInsight(insight);
    
    // Notify user if significant savings
    if (savings.total_saved >= 10.00) {
        await this.notifySignificantSavings(sessionId, insight);
    }
}
```

---

## Error Handling and Fallbacks

### Comprehensive Error Management
```javascript
// TODO: Implement robust error handling
async handlePaymentError(error, context) {
    const errorType = this.classifyPaymentError(error);
    
    switch (errorType) {
        case 'card_declined':
            return await this.handleCardDeclined(error, context);
        case 'insufficient_funds':
            return await this.handleInsufficientFunds(error, context);
        case 'rate_limit_exceeded':
            return await this.handleRateLimit(error, context);
        case 'api_error':
            return await this.handleAPIError(error, context);
        default:
            return await this.handleGenericError(error, context);
    }
}

async handleCardDeclined(error, context) {
    // TODO: Handle card declined scenarios
    return {
        error_type: 'card_declined',
        user_message: 'Your card was declined. Please try a different payment method.',
        fallback_options: [
            {
                type: 'alternative_payment',
                description: 'Try a different card',
                action: 'retry_payment'
            },
            {
                type: 'free_trial',
                description: 'Use 3 free exports',
                action: 'enable_trial',
                conditions: await this.checkTrialEligibility(context.sessionId)
            }
        ],
        retry_allowed: true,
        support_contact: 'support@mirror.ai'
    };
}

async getFallbackPaymentOptions(exportRequest) {
    // TODO: Provide fallback payment options
    const options = [];

    // Check if user is eligible for free trial
    const trialEligible = await this.checkTrialEligibility(exportRequest.sessionId);
    if (trialEligible.eligible) {
        options.push({
            type: 'free_trial',
            description: `${trialEligible.remaining} free exports remaining`,
            action: 'use_trial',
            cost: 0
        });
    }

    // Offer delayed processing
    options.push({
        type: 'delayed_processing',
        description: 'Process export in 24 hours (free)',
        action: 'schedule_delayed',
        cost: 0,
        delay: '24 hours'
    });

    // Offer reduced quality export
    options.push({
        type: 'basic_export',
        description: 'Basic export (text only)',
        action: 'basic_export',
        cost: 0.50
    });

    return options;
}

async monitorPaymentHealth() {
    // TODO: Monitor overall payment system health
    const metrics = {
        success_rate: await this.calculatePaymentSuccessRate(),
        average_processing_time: await this.calculateAverageProcessingTime(),
        error_rate_by_type: await this.getErrorRatesByType(),
        revenue_metrics: await this.getRevenueMetrics(),
        byok_adoption: await this.getBYOKAdoptionRate()
    };

    // Alert on critical issues
    if (metrics.success_rate < 0.95) {
        await this.alertCriticalPaymentIssue('Low success rate', metrics);
    }

    if (metrics.average_processing_time > 5000) {
        await this.alertCriticalPaymentIssue('High processing time', metrics);
    }

    return metrics;
}
```

---

## Analytics and Reporting

### Business Intelligence Dashboard
```javascript
// TODO: Implement comprehensive analytics
async generateRevenueReport(timeframe = 'month') {
    const report = {
        timeframe: timeframe,
        generated_at: new Date().toISOString(),
        soft_mode: {
            exports: await this.countExports('soft', timeframe),
            revenue: await this.calculateRevenue('soft', timeframe),
            average_per_export: this.pricing.soft_mode.export_price
        },
        platform_mode: {
            api_calls: await this.countAPICalls('platform', timeframe),
            revenue: await this.calculateRevenue('platform', timeframe),
            byok_usage: await this.getBYOKUsage(timeframe),
            cost_savings_provided: await this.getTotalCostSavings(timeframe)
        },
        growth_metrics: {
            user_growth: await this.calculateUserGrowth(timeframe),
            revenue_growth: await this.calculateRevenueGrowth(timeframe),
            retention_rate: await this.calculateRetentionRate(timeframe)
        },
        top_insights: await this.generateTopInsights(timeframe)
    };

    return report;
}

async generateUsagePatterns(sessionId) {
    // TODO: Analyze individual user usage patterns
    const patterns = {
        session_id: sessionId,
        analysis_date: new Date().toISOString(),
        usage_trends: {
            preferred_times: await this.getPreferredUsageTimes(sessionId),
            frequency: await this.getUsageFrequency(sessionId),
            export_patterns: await this.getExportPatterns(sessionId),
            cost_efficiency: await this.getCostEfficiency(sessionId)
        },
        recommendations: {
            cost_optimization: await this.getCostOptimizationRecommendations(sessionId),
            usage_optimization: await this.getUsageOptimizationRecommendations(sessionId),
            feature_suggestions: await this.getFeatureSuggestions(sessionId)
        },
        forecasts: {
            monthly_cost: await this.forecastMonthlyCost(sessionId),
            usage_projection: await this.projectUsage(sessionId),
            savings_potential: await this.calculateSavingsPotential(sessionId)
        }
    };

    return patterns;
}
```

---

## Integration Points

### API Endpoints
- `POST /api/payments/export` → Create export payment intent
- `POST /api/payments/confirm` → Confirm payment and process export
- `POST /api/payments/api-call` → Route and bill API calls
- `GET /api/usage/stats` → Get usage statistics
- `GET /api/receipts` → Get user receipts
- `POST /api/byok/validate` → Validate API tokens

### Configuration Options
```javascript
const stripeRouter = new StripeMirrorRouter({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    testMode: true,
    vaultPath: './vault',
    pricing: {
        soft_mode: { export_price: 1.00 },
        platform_mode: { api_call_price: 0.01 }
    }
});
```

### Event System
```javascript
// Emit events for other modules
stripeRouter.on('payment_completed', (payment) => {
    // Handle completed payments
});

stripeRouter.on('rate_limit_exceeded', (session) => {
    // Handle rate limit violations
});

stripeRouter.on('cost_savings_milestone', (savings) => {
    // Celebrate BYOK savings milestones
});
```

**Implementation Priority**: Start with basic Stripe integration for exports, add micro-payment processing, implement BYOK validation, then add analytics and advanced features.