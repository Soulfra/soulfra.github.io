#!/usr/bin/env node

/**
 * ExternalEventRouter.js
 * Accepts and normalizes external events from webhooks, APIs, and triggers
 * Converts to internal Soulfra format for processing
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

class ExternalEventRouter {
    constructor() {
        this.port = process.env.EXTERNAL_EVENT_PORT || 9999;
        this.vaultPath = path.join(__dirname, '../../../');
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.eventLogPath = path.join(this.logsPath, 'external-event-log.json');
        
        // Supported event sources
        this.eventSources = {
            webhook: this.processWebhook.bind(this),
            notion: this.processNotionEvent.bind(this),
            discord: this.processDiscordEvent.bind(this),
            calendar: this.processCalendarEvent.bind(this),
            email: this.processEmailTrigger.bind(this),
            api: this.processApiCall.bind(this),
            ifttt: this.processIftttEvent.bind(this)
        };
        
        // Event schema validation
        this.requiredFields = ['source', 'type', 'data'];
        
        this.initializeEventLog();
    }
    
    initializeEventLog() {
        if (!fs.existsSync(this.eventLogPath)) {
            fs.writeFileSync(this.eventLogPath, JSON.stringify({
                router_id: `external_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
                created: new Date().toISOString(),
                sources: Object.keys(this.eventSources),
                events: []
            }, null, 2));
        }
    }
    
    /**
     * Normalize external event to internal format
     */
    normalizeEvent(rawEvent, source) {
        const eventId = `ext_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        return {
            id: eventId,
            timestamp: Date.now(),
            source: source,
            type: rawEvent.type || 'unknown',
            priority: this.calculatePriority(rawEvent),
            data: rawEvent.data || rawEvent,
            metadata: {
                raw_size: JSON.stringify(rawEvent).length,
                normalized_at: new Date().toISOString(),
                headers: rawEvent.headers || {},
                origin: rawEvent.origin || 'external'
            },
            routing: {
                requires_trust_verification: true,
                target_router: 'cal',
                fallback_router: 'presence-logger'
            },
            processing: {
                status: 'pending',
                attempts: 0,
                last_attempt: null
            }
        };
    }
    
    calculatePriority(event) {
        // High priority for certain keywords or sources
        const highPriorityKeywords = ['urgent', 'critical', 'emergency', 'now'];
        const eventString = JSON.stringify(event).toLowerCase();
        
        for (const keyword of highPriorityKeywords) {
            if (eventString.includes(keyword)) {
                return 'high';
            }
        }
        
        // Source-based priority
        if (event.source === 'calendar' && event.type === 'reminder') {
            return 'high';
        }
        
        if (event.source === 'email' && event.subject?.includes('Important')) {
            return 'medium';
        }
        
        return 'normal';
    }
    
    /**
     * Process webhook events
     */
    async processWebhook(data, headers) {
        const webhookEvent = {
            type: 'webhook',
            webhook_id: headers['x-webhook-id'] || 'unknown',
            signature: headers['x-webhook-signature'],
            data: data,
            headers: headers
        };
        
        // Verify webhook signature if provided
        if (webhookEvent.signature) {
            const verified = this.verifyWebhookSignature(data, webhookEvent.signature);
            webhookEvent.verified = verified;
        }
        
        return this.normalizeEvent(webhookEvent, 'webhook');
    }
    
    /**
     * Process Notion integration events
     */
    async processNotionEvent(data) {
        const notionEvent = {
            type: data.type || 'notion_update',
            page_id: data.page_id,
            database_id: data.database_id,
            action: data.action || 'updated',
            properties: data.properties || {},
            user: data.user || 'notion_integration',
            data: {
                title: data.properties?.title?.title?.[0]?.text?.content,
                status: data.properties?.status?.select?.name,
                tags: data.properties?.tags?.multi_select?.map(t => t.name),
                content: data.content
            }
        };
        
        return this.normalizeEvent(notionEvent, 'notion');
    }
    
    /**
     * Process Discord bot events
     */
    async processDiscordEvent(data) {
        const discordEvent = {
            type: data.type || 'message',
            channel_id: data.channel_id,
            user_id: data.user_id || data.author?.id,
            username: data.username || data.author?.username,
            content: data.content,
            mentions: data.mentions || [],
            data: {
                message: data.content,
                attachments: data.attachments || [],
                embeds: data.embeds || [],
                timestamp: data.timestamp
            }
        };
        
        // Check if bot was mentioned
        if (data.mentions?.some(m => m.bot)) {
            discordEvent.priority = 'high';
            discordEvent.type = 'mention';
        }
        
        return this.normalizeEvent(discordEvent, 'discord');
    }
    
    /**
     * Process calendar events
     */
    async processCalendarEvent(data) {
        const calendarEvent = {
            type: data.type || 'event',
            calendar_id: data.calendar_id,
            event_id: data.event_id,
            action: data.action || 'reminder',
            data: {
                title: data.summary || data.title,
                description: data.description,
                start: data.start?.dateTime || data.start,
                end: data.end?.dateTime || data.end,
                location: data.location,
                attendees: data.attendees || [],
                recurrence: data.recurrence
            }
        };
        
        // Check if event is happening soon
        if (calendarEvent.data.start) {
            const startTime = new Date(calendarEvent.data.start).getTime();
            const timeTillEvent = startTime - Date.now();
            
            if (timeTillEvent < 3600000 && timeTillEvent > 0) { // Within 1 hour
                calendarEvent.priority = 'high';
                calendarEvent.type = 'upcoming_event';
            }
        }
        
        return this.normalizeEvent(calendarEvent, 'calendar');
    }
    
    /**
     * Process email triggers
     */
    async processEmailTrigger(data) {
        const emailEvent = {
            type: 'email_trigger',
            from: data.from,
            to: data.to,
            subject: data.subject,
            trigger_phrase: data.trigger,
            data: {
                headers: data.headers || {},
                body_preview: data.body?.substring(0, 500),
                attachments: data.attachments?.map(a => ({
                    filename: a.filename,
                    size: a.size,
                    type: a.contentType
                })),
                labels: data.labels || [],
                timestamp: data.timestamp || Date.now()
            }
        };
        
        // Extract commands from subject or body
        const commandMatch = (data.subject + ' ' + data.body)
            .match(/\[SOULFRA:([^\]]+)\]/i);
        
        if (commandMatch) {
            emailEvent.type = 'email_command';
            emailEvent.command = commandMatch[1].trim();
            emailEvent.priority = 'high';
        }
        
        return this.normalizeEvent(emailEvent, 'email');
    }
    
    /**
     * Process generic API calls
     */
    async processApiCall(data, headers) {
        const apiEvent = {
            type: data.action || 'api_call',
            endpoint: data.endpoint,
            method: data.method || 'POST',
            api_key_id: headers['x-api-key'] ? crypto.createHash('sha256')
                .update(headers['x-api-key']).digest('hex').substring(0, 8) : null,
            data: data.payload || data,
            headers: {
                user_agent: headers['user-agent'],
                origin: headers['origin'],
                content_type: headers['content-type']
            }
        };
        
        return this.normalizeEvent(apiEvent, 'api');
    }
    
    /**
     * Process IFTTT events
     */
    async processIftttEvent(data) {
        const iftttEvent = {
            type: 'ifttt_trigger',
            trigger: data.trigger || data.event,
            ingredients: data.ingredients || {},
            data: {
                created_at: data.created_at,
                meta: data.meta || {},
                values: data.values || data.ingredients
            }
        };
        
        // Map IFTTT ingredients to meaningful data
        if (iftttEvent.ingredients) {
            iftttEvent.data.parsed = {
                text: iftttEvent.ingredients.TextField || 
                      iftttEvent.ingredients.Value1 || 
                      iftttEvent.ingredients.Message,
                url: iftttEvent.ingredients.URL || 
                     iftttEvent.ingredients.LinkURL,
                occurred_at: iftttEvent.ingredients.OccurredAt || 
                            iftttEvent.ingredients.CreatedAt
            };
        }
        
        return this.normalizeEvent(iftttEvent, 'ifttt');
    }
    
    /**
     * Verify webhook signatures
     */
    verifyWebhookSignature(payload, signature) {
        // Example HMAC verification (customize based on webhook provider)
        const secret = process.env.WEBHOOK_SECRET || 'soulfra_webhook_secret';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
    
    /**
     * Log event to vault
     */
    async logEvent(event) {
        const eventLog = JSON.parse(fs.readFileSync(this.eventLogPath, 'utf8'));
        
        eventLog.events.push(event);
        eventLog.last_event = new Date().toISOString();
        eventLog.total_events = eventLog.events.length;
        
        // Keep only last 10000 events
        if (eventLog.events.length > 10000) {
            eventLog.events = eventLog.events.slice(-10000);
        }
        
        // Update source statistics
        if (!eventLog.statistics) {
            eventLog.statistics = {};
        }
        
        if (!eventLog.statistics[event.source]) {
            eventLog.statistics[event.source] = { count: 0, last_seen: null };
        }
        
        eventLog.statistics[event.source].count++;
        eventLog.statistics[event.source].last_seen = event.timestamp;
        
        fs.writeFileSync(this.eventLogPath, JSON.stringify(eventLog, null, 2));
        
        // Also write to Cal input queue for processing
        await this.queueForCal(event);
    }
    
    /**
     * Queue event for Cal processing
     */
    async queueForCal(event) {
        const calQueuePath = path.join(this.logsPath, 'cal-input-queue.json');
        let queue = { events: [] };
        
        if (fs.existsSync(calQueuePath)) {
            queue = JSON.parse(fs.readFileSync(calQueuePath, 'utf8'));
        }
        
        queue.events.push({
            ...event,
            queued_by: 'external_event_router',
            queued_at: Date.now(),
            processing_required: 'trust_verification'
        });
        
        fs.writeFileSync(calQueuePath, JSON.stringify(queue, null, 2));
    }
    
    /**
     * Start HTTP server
     */
    async start() {
        const server = http.createServer(async (req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Id, X-Webhook-Signature, X-API-Key');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.method === 'POST' && pathname.startsWith('/event/')) {
                const source = pathname.split('/')[2];
                
                if (!this.eventSources[source]) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Unknown event source' }));
                    return;
                }
                
                // Collect request body
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                    try {
                        const data = JSON.parse(body);
                        const headers = req.headers;
                        
                        // Process event based on source
                        const normalizedEvent = await this.eventSources[source](data, headers);
                        
                        // Log event
                        await this.logEvent(normalizedEvent);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            event_id: normalizedEvent.id,
                            status: 'queued_for_processing'
                        }));
                        
                        console.log(`📨 External event received: ${source} - ${normalizedEvent.type}`);
                        
                    } catch (error) {
                        console.error('Event processing error:', error);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (req.method === 'GET' && pathname === '/status') {
                const eventLog = JSON.parse(fs.readFileSync(this.eventLogPath, 'utf8'));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'active',
                    router_id: eventLog.router_id,
                    total_events: eventLog.total_events || 0,
                    statistics: eventLog.statistics || {},
                    supported_sources: Object.keys(this.eventSources)
                }));
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log('🌐 External Event Router started');
            console.log(`📡 Listening on port ${this.port}`);
            console.log('\nEndpoints:');
            Object.keys(this.eventSources).forEach(source => {
                console.log(`  POST /event/${source}`);
            });
            console.log('  GET /status');
            console.log('\nEvents logged to:', this.eventLogPath);
        });
    }
}

// Run if called directly
if (require.main === module) {
    const router = new ExternalEventRouter();
    router.start().catch(console.error);
}

module.exports = ExternalEventRouter;