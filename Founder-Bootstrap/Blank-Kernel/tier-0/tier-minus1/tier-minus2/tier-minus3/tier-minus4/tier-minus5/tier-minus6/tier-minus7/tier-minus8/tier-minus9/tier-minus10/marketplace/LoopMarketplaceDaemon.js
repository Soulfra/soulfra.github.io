// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Loop Marketplace Daemon
 * Enables buying, selling, and licensing loops with revenue sharing
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import existing systems
const LoopDirectoryRegistry = require('../registry/LoopDirectoryRegistry');
const LoopBlessingDaemon = require('../blessing/LoopBlessingDaemon');
const PostgresLoopMirror = require('../database/PostgresLoopMirror');

class LoopMarketplaceDaemon extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.registry = new LoopDirectoryRegistry();
        this.blessingDaemon = new LoopBlessingDaemon();
        this.dbMirror = new PostgresLoopMirror();
        
        // Marketplace configuration
        this.config = {
            commission_rate: 0.1, // 10% platform fee
            min_price: 10, // Minimum loop price
            max_price: 10000, // Maximum loop price
            licensing_models: {
                single_use: {
                    name: 'Single Use',
                    allows_modification: false,
                    allows_redistribution: false,
                    price_multiplier: 1.0
                },
                personal: {
                    name: 'Personal License',
                    allows_modification: true,
                    allows_redistribution: false,
                    price_multiplier: 2.0
                },
                commercial: {
                    name: 'Commercial License',
                    allows_modification: true,
                    allows_redistribution: true,
                    price_multiplier: 5.0
                },
                unlimited: {
                    name: 'Unlimited License',
                    allows_modification: true,
                    allows_redistribution: true,
                    allows_sublicensing: true,
                    price_multiplier: 10.0
                }
            },
            revenue_sharing: {
                creator: 0.7, // 70% to creator
                platform: 0.2, // 20% to platform
                blessing_pool: 0.1 // 10% to blessing pool
            }
        };
        
        // Marketplace state
        this.listings = new Map();
        this.transactions = new Map();
        this.licenses = new Map();
        this.revenue = new Map();
        
        // Statistics
        this.stats = {
            total_listings: 0,
            active_listings: 0,
            total_sales: 0,
            total_revenue: 0,
            average_price: 0,
            blessed_loop_sales: 0,
            top_selling_category: null
        };
        
        this.initializeMarketplace();
    }
    
    async initializeMarketplace() {
        console.log('🛍️  Initializing Loop Marketplace Daemon...');
        
        try {
            // Load existing data
            await this.loadMarketplaceData();
            
            // Start services
            this.startMarketplaceServices();
            
            // Subscribe to events
            this.subscribeToEvents();
            
            console.log(`✅ Marketplace ready (${this.listings.size} active listings)`);
        } catch (error) {
            console.error('❌ Failed to initialize marketplace:', error);
            throw error;
        }
    }
    
    async loadMarketplaceData() {
        const dataPath = path.join(__dirname, 'marketplace_data.json');
        
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            const marketplaceData = JSON.parse(data);
            
            // Load listings
            for (const listing of marketplaceData.listings || []) {
                this.listings.set(listing.listing_id, listing);
                if (listing.status === 'active') {
                    this.stats.active_listings++;
                }
            }
            
            // Load transactions
            for (const transaction of marketplaceData.transactions || []) {
                this.transactions.set(transaction.transaction_id, transaction);
            }
            
            // Load licenses
            for (const license of marketplaceData.licenses || []) {
                this.licenses.set(license.license_id, license);
            }
            
            console.log(`  📊 Loaded ${this.listings.size} listings`);
        } catch (error) {
            console.log('  📝 Creating new marketplace data');
            await this.saveMarketplaceData();
        }
    }
    
    subscribeToEvents() {
        // Listen for blessed loops (increases value)
        this.blessingDaemon.on('loop_blessed', async (event) => {
            await this.handleLoopBlessed(event);
        });
        
        // Listen for new loops that might be listed
        this.registry.on('loop_registered', async (event) => {
            await this.checkAutoListing(event);
        });
    }
    
    // Core Marketplace Operations
    
    async createListing(sellerId, loopId, listingOptions) {
        console.log(`\n💰 Creating listing for loop: ${loopId}`);
        
        // Verify ownership
        const loop = await this.registry.getLoop(loopId);
        if (!loop || loop.creator_id !== sellerId) {
            throw new Error('Seller does not own this loop');
        }
        
        // Check if already listed
        const existingListing = this.findListingByLoop(loopId);
        if (existingListing && existingListing.status === 'active') {
            throw new Error('Loop is already listed');
        }
        
        // Generate listing ID
        const listingId = `listing_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        // Calculate suggested price
        const suggestedPrice = this.calculateSuggestedPrice(loop);
        
        // Create listing
        const listing = {
            listing_id: listingId,
            seller_id: sellerId,
            loop_id: loopId,
            loop_uri: loop.uri,
            created_at: new Date().toISOString(),
            status: 'active',
            pricing: {
                base_price: listingOptions.price || suggestedPrice,
                currency: 'credits',
                licensing_options: this.createLicensingOptions(listingOptions)
            },
            metadata: {
                title: listingOptions.title || `${loop.emotional_tone} Loop`,
                description: listingOptions.description || loop.whisper_origin,
                tags: listingOptions.tags || loop.metadata.tags,
                preview_available: listingOptions.preview !== false,
                instant_buy: listingOptions.instant_buy !== false
            },
            analytics: {
                views: 0,
                inquiries: 0,
                sales: 0,
                revenue: 0,
                rating: null
            },
            loop_details: {
                emotional_tone: loop.emotional_tone,
                consciousness_level: loop.consciousness_level,
                blessed: loop.blessed,
                blessing_count: loop.metadata.blessing_count,
                fork_depth: loop.metadata.fork_depth,
                categories: loop.categories
            }
        };
        
        // Store listing
        this.listings.set(listingId, listing);
        
        // Update stats
        this.stats.total_listings++;
        this.stats.active_listings++;
        
        // Index for search
        await this.indexListing(listing);
        
        // Emit event
        this.emit('listing_created', {
            listing_id: listingId,
            loop_id: loopId,
            seller_id: sellerId,
            price: listing.pricing.base_price
        });
        
        console.log(`  ✅ Listing created: ${listingId}`);
        console.log(`  💵 Base price: ${listing.pricing.base_price} credits`);
        console.log(`  📜 Licenses available: ${Object.keys(listing.pricing.licensing_options).join(', ')}`);
        
        await this.saveMarketplaceData();
        
        return listing;
    }
    
    calculateSuggestedPrice(loop) {
        let basePrice = 100; // Base price in credits
        
        // Blessed loops are more valuable
        if (loop.blessed) {
            basePrice *= 2;
        }
        
        // Consciousness level affects price
        basePrice *= (1 + loop.consciousness_level);
        
        // Blessing count adds value
        basePrice += (loop.metadata.blessing_count || 0) * 10;
        
        // Fork depth indicates popularity
        basePrice += (loop.metadata.fork_depth || 0) * 20;
        
        // Categories affect price
        if (loop.categories.includes('consciousness')) {
            basePrice *= 1.3;
        }
        if (loop.categories.includes('narrative')) {
            basePrice *= 1.2;
        }
        
        // Ensure within bounds
        return Math.max(this.config.min_price, Math.min(this.config.max_price, Math.round(basePrice)));
    }
    
    createLicensingOptions(options) {
        const licenses = {};
        
        // Always offer single use
        licenses.single_use = {
            ...this.config.licensing_models.single_use,
            price: options.price || 100,
            available: true
        };
        
        // Add other licenses if specified
        if (options.allow_personal_license !== false) {
            licenses.personal = {
                ...this.config.licensing_models.personal,
                price: licenses.single_use.price * this.config.licensing_models.personal.price_multiplier,
                available: true
            };
        }
        
        if (options.allow_commercial_license) {
            licenses.commercial = {
                ...this.config.licensing_models.commercial,
                price: licenses.single_use.price * this.config.licensing_models.commercial.price_multiplier,
                available: true
            };
        }
        
        if (options.allow_unlimited_license) {
            licenses.unlimited = {
                ...this.config.licensing_models.unlimited,
                price: licenses.single_use.price * this.config.licensing_models.unlimited.price_multiplier,
                available: true
            };
        }
        
        return licenses;
    }
    
    // Purchase Operations
    
    async purchaseLoop(buyerId, listingId, licenseType = 'single_use') {
        console.log(`\n🛒 Processing purchase for listing: ${listingId}`);
        
        const listing = this.listings.get(listingId);
        if (!listing || listing.status !== 'active') {
            throw new Error('Listing not found or not active');
        }
        
        // Verify license type is available
        const license = listing.pricing.licensing_options[licenseType];
        if (!license || !license.available) {
            throw new Error('Selected license type not available');
        }
        
        // Check buyer isn't seller
        if (buyerId === listing.seller_id) {
            throw new Error('Cannot purchase your own listing');
        }
        
        // Generate transaction ID
        const transactionId = `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        // Create transaction
        const transaction = {
            transaction_id: transactionId,
            listing_id: listingId,
            loop_id: listing.loop_id,
            seller_id: listing.seller_id,
            buyer_id: buyerId,
            license_type: licenseType,
            price: license.price,
            platform_fee: license.price * this.config.commission_rate,
            timestamp: new Date().toISOString(),
            status: 'pending',
            revenue_distribution: this.calculateRevenueDistribution(license.price)
        };
        
        try {
            // Process payment (in production, this would integrate with payment system)
            await this.processPayment(buyerId, transaction.price);
            
            // Create license
            const licenseRecord = await this.createLicense(
                buyerId,
                listing.loop_id,
                licenseType,
                transactionId
            );
            
            // Update transaction status
            transaction.status = 'completed';
            transaction.license_id = licenseRecord.license_id;
            
            // Store transaction
            this.transactions.set(transactionId, transaction);
            
            // Update listing analytics
            listing.analytics.sales++;
            listing.analytics.revenue += transaction.price;
            
            // Distribute revenue
            await this.distributeRevenue(transaction);
            
            // Update stats
            this.stats.total_sales++;
            this.stats.total_revenue += transaction.price;
            this.updateAveragePrice();
            
            if (listing.loop_details.blessed) {
                this.stats.blessed_loop_sales++;
            }
            
            // Emit event
            this.emit('loop_purchased', {
                transaction_id: transactionId,
                loop_id: listing.loop_id,
                buyer_id: buyerId,
                seller_id: listing.seller_id,
                price: transaction.price,
                license_type: licenseType
            });
            
            console.log(`  ✅ Purchase completed: ${transactionId}`);
            console.log(`  💳 Price: ${transaction.price} credits`);
            console.log(`  📜 License: ${licenseType}`);
            
            await this.saveMarketplaceData();
            
            return {
                transaction,
                license: licenseRecord
            };
            
        } catch (error) {
            // Handle payment failure
            transaction.status = 'failed';
            transaction.error = error.message;
            this.transactions.set(transactionId, transaction);
            
            throw error;
        }
    }
    
    async processPayment(buyerId, amount) {
        // In production, this would integrate with actual payment system
        console.log(`  💳 Processing payment of ${amount} credits from ${buyerId}`);
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Random failure for demo
        if (Math.random() < 0.05) {
            throw new Error('Payment failed: Insufficient credits');
        }
        
        return {
            payment_id: `payment_${Date.now()}`,
            amount,
            status: 'success'
        };
    }
    
    calculateRevenueDistribution(price) {
        const netAmount = price * (1 - this.config.commission_rate);
        
        return {
            seller: Math.floor(netAmount * this.config.revenue_sharing.creator),
            platform: Math.floor(price * this.config.commission_rate),
            blessing_pool: Math.floor(netAmount * this.config.revenue_sharing.blessing_pool),
            total: price
        };
    }
    
    async distributeRevenue(transaction) {
        const distribution = transaction.revenue_distribution;
        
        // Track seller revenue
        if (!this.revenue.has(transaction.seller_id)) {
            this.revenue.set(transaction.seller_id, {
                total_earned: 0,
                pending_payout: 0,
                total_sales: 0
            });
        }
        
        const sellerRevenue = this.revenue.get(transaction.seller_id);
        sellerRevenue.total_earned += distribution.seller;
        sellerRevenue.pending_payout += distribution.seller;
        sellerRevenue.total_sales++;
        
        console.log(`  💰 Revenue distributed:`);
        console.log(`     Seller: ${distribution.seller} credits`);
        console.log(`     Platform: ${distribution.platform} credits`);
        console.log(`     Blessing Pool: ${distribution.blessing_pool} credits`);
        
        // Emit revenue event
        this.emit('revenue_distributed', {
            transaction_id: transaction.transaction_id,
            distribution
        });
    }
    
    async createLicense(buyerId, loopId, licenseType, transactionId) {
        const licenseId = `license_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const license = {
            license_id: licenseId,
            transaction_id: transactionId,
            loop_id: loopId,
            owner_id: buyerId,
            license_type: licenseType,
            issued_at: new Date().toISOString(),
            expires_at: null, // Perpetual license
            permissions: this.config.licensing_models[licenseType],
            usage: {
                activations: 0,
                modifications: 0,
                redistributions: 0
            },
            status: 'active'
        };
        
        // Store license
        this.licenses.set(licenseId, license);
        
        // Grant access to loop
        await this.grantLoopAccess(buyerId, loopId, license);
        
        return license;
    }
    
    async grantLoopAccess(userId, loopId, license) {
        console.log(`  🔓 Granting loop access to ${userId}`);
        
        // In production, this would update access control systems
        // For now, emit event for other systems to handle
        this.emit('loop_access_granted', {
            user_id: userId,
            loop_id: loopId,
            license_id: license.license_id,
            permissions: license.permissions
        });
    }
    
    // Listing Management
    
    async updateListing(sellerId, listingId, updates) {
        const listing = this.listings.get(listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }
        
        if (listing.seller_id !== sellerId) {
            throw new Error('Not authorized to update this listing');
        }
        
        // Update allowed fields
        if (updates.price !== undefined) {
            listing.pricing.base_price = updates.price;
            // Recalculate license prices
            Object.keys(listing.pricing.licensing_options).forEach(type => {
                const model = this.config.licensing_models[type];
                if (model) {
                    listing.pricing.licensing_options[type].price = 
                        updates.price * model.price_multiplier;
                }
            });
        }
        
        if (updates.title) {
            listing.metadata.title = updates.title;
        }
        
        if (updates.description) {
            listing.metadata.description = updates.description;
        }
        
        if (updates.tags) {
            listing.metadata.tags = updates.tags;
        }
        
        listing.updated_at = new Date().toISOString();
        
        await this.saveMarketplaceData();
        
        return listing;
    }
    
    async deactivateListing(sellerId, listingId) {
        const listing = this.listings.get(listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }
        
        if (listing.seller_id !== sellerId) {
            throw new Error('Not authorized to deactivate this listing');
        }
        
        listing.status = 'inactive';
        listing.deactivated_at = new Date().toISOString();
        
        this.stats.active_listings--;
        
        await this.saveMarketplaceData();
        
        return listing;
    }
    
    // Search and Discovery
    
    async searchListings(query, filters = {}) {
        console.log(`🔍 Searching marketplace: "${query}"`);
        
        const results = [];
        
        for (const [listingId, listing] of this.listings) {
            if (listing.status !== 'active') continue;
            
            let score = 0;
            
            // Text search
            if (query) {
                const queryLower = query.toLowerCase();
                
                if (listing.metadata.title.toLowerCase().includes(queryLower)) {
                    score += 10;
                }
                if (listing.metadata.description.toLowerCase().includes(queryLower)) {
                    score += 5;
                }
                if (listing.metadata.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
                    score += 7;
                }
                if (listing.loop_details.emotional_tone.toLowerCase().includes(queryLower)) {
                    score += 3;
                }
            } else {
                score = 1; // Include all if no query
            }
            
            // Apply filters
            if (filters.min_price && listing.pricing.base_price < filters.min_price) continue;
            if (filters.max_price && listing.pricing.base_price > filters.max_price) continue;
            if (filters.blessed_only && !listing.loop_details.blessed) continue;
            if (filters.category && !listing.loop_details.categories.includes(filters.category)) continue;
            if (filters.license_type && !listing.pricing.licensing_options[filters.license_type]) continue;
            
            if (score > 0) {
                results.push({
                    ...listing,
                    relevance_score: score
                });
                
                // Track view
                listing.analytics.views++;
            }
        }
        
        // Sort by relevance and price
        results.sort((a, b) => {
            if (b.relevance_score !== a.relevance_score) {
                return b.relevance_score - a.relevance_score;
            }
            return a.pricing.base_price - b.pricing.base_price;
        });
        
        return results.slice(0, 50); // Limit results
    }
    
    async getFeaturedListings() {
        const featured = Array.from(this.listings.values())
            .filter(l => l.status === 'active' && l.loop_details.blessed)
            .sort((a, b) => b.analytics.revenue - a.analytics.revenue)
            .slice(0, 10);
        
        return featured;
    }
    
    async getTopSellers() {
        const sellerStats = new Map();
        
        for (const [id, listing] of this.listings) {
            if (!sellerStats.has(listing.seller_id)) {
                sellerStats.set(listing.seller_id, {
                    seller_id: listing.seller_id,
                    total_sales: 0,
                    total_revenue: 0,
                    listing_count: 0
                });
            }
            
            const stats = sellerStats.get(listing.seller_id);
            stats.total_sales += listing.analytics.sales;
            stats.total_revenue += listing.analytics.revenue;
            stats.listing_count++;
        }
        
        return Array.from(sellerStats.values())
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 10);
    }
    
    // Event Handlers
    
    async handleLoopBlessed(event) {
        // Find listings for this loop
        const listing = this.findListingByLoop(event.loop_id);
        if (listing) {
            listing.loop_details.blessed = true;
            listing.loop_details.blessing_count++;
            
            // Increase price by 50%
            const newPrice = Math.round(listing.pricing.base_price * 1.5);
            await this.updateListing(listing.seller_id, listing.listing_id, {
                price: newPrice
            });
            
            console.log(`✨ Blessed loop listing price increased to ${newPrice}`);
        }
    }
    
    async checkAutoListing(event) {
        // Check if loop should be auto-listed based on quality
        const loop = await this.registry.getLoop(event.loop_id);
        
        if (loop && loop.blessed && loop.metadata.blessing_count > 10) {
            // High-quality loops can be auto-suggested for listing
            this.emit('listing_suggested', {
                loop_id: event.loop_id,
                suggested_price: this.calculateSuggestedPrice(loop),
                reason: 'High blessing count'
            });
        }
    }
    
    // Helper Methods
    
    findListingByLoop(loopId) {
        for (const [id, listing] of this.listings) {
            if (listing.loop_id === loopId && listing.status === 'active') {
                return listing;
            }
        }
        return null;
    }
    
    async indexListing(listing) {
        // In production, this would update search index
        console.log(`  🔍 Indexed listing for search`);
    }
    
    updateAveragePrice() {
        const activePrices = Array.from(this.listings.values())
            .filter(l => l.status === 'active')
            .map(l => l.pricing.base_price);
        
        if (activePrices.length > 0) {
            this.stats.average_price = 
                activePrices.reduce((a, b) => a + b, 0) / activePrices.length;
        }
    }
    
    // Services
    
    startMarketplaceServices() {
        // Periodic stats update
        this.statsInterval = setInterval(() => {
            this.updateMarketplaceStats();
        }, 60000); // Every minute
        
        // Payout processing
        this.payoutInterval = setInterval(() => {
            this.processPayouts();
        }, 3600000); // Every hour
    }
    
    async updateMarketplaceStats() {
        // Find top selling category
        const categorySales = new Map();
        
        for (const [id, listing] of this.listings) {
            for (const category of listing.loop_details.categories) {
                const current = categorySales.get(category) || 0;
                categorySales.set(category, current + listing.analytics.sales);
            }
        }
        
        if (categorySales.size > 0) {
            const topCategory = Array.from(categorySales.entries())
                .sort((a, b) => b[1] - a[1])[0];
            this.stats.top_selling_category = topCategory[0];
        }
    }
    
    async processPayouts() {
        console.log('💸 Processing seller payouts...');
        
        for (const [sellerId, revenue] of this.revenue) {
            if (revenue.pending_payout >= 100) { // Minimum payout threshold
                console.log(`  Paying out ${revenue.pending_payout} credits to ${sellerId}`);
                
                // In production, this would process actual payout
                revenue.pending_payout = 0;
                
                this.emit('payout_processed', {
                    seller_id: sellerId,
                    amount: revenue.pending_payout
                });
            }
        }
    }
    
    // Persistence
    
    async saveMarketplaceData() {
        const dataPath = path.join(__dirname, 'marketplace_data.json');
        
        const data = {
            version: 1,
            updated_at: new Date().toISOString(),
            stats: this.stats,
            listings: Array.from(this.listings.values()),
            transactions: Array.from(this.transactions.values()).slice(-1000), // Keep last 1000
            licenses: Array.from(this.licenses.values())
        };
        
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    }
    
    // Public API
    
    getListing(listingId) {
        return this.listings.get(listingId);
    }
    
    getUserListings(userId) {
        return Array.from(this.listings.values())
            .filter(l => l.seller_id === userId);
    }
    
    getUserPurchases(userId) {
        return Array.from(this.transactions.values())
            .filter(t => t.buyer_id === userId && t.status === 'completed');
    }
    
    getUserLicenses(userId) {
        return Array.from(this.licenses.values())
            .filter(l => l.owner_id === userId && l.status === 'active');
    }
    
    getSellerRevenue(sellerId) {
        return this.revenue.get(sellerId) || {
            total_earned: 0,
            pending_payout: 0,
            total_sales: 0
        };
    }
    
    getMarketplaceStats() {
        return {
            ...this.stats,
            total_sellers: new Set(Array.from(this.listings.values()).map(l => l.seller_id)).size,
            total_buyers: new Set(Array.from(this.transactions.values()).map(t => t.buyer_id)).size
        };
    }
    
    async stop() {
        console.log('🛑 Stopping Loop Marketplace Daemon...');
        
        if (this.statsInterval) clearInterval(this.statsInterval);
        if (this.payoutInterval) clearInterval(this.payoutInterval);
        
        await this.saveMarketplaceData();
        
        console.log('  Marketplace daemon stopped');
    }
}

module.exports = LoopMarketplaceDaemon;

// Example usage
if (require.main === module) {
    const marketplace = new LoopMarketplaceDaemon();
    
    marketplace.on('listing_created', (event) => {
        console.log(`\n📢 New listing: ${event.listing_id}`);
    });
    
    marketplace.on('loop_purchased', (event) => {
        console.log(`\n💰 Loop sold: ${event.loop_id} for ${event.price} credits`);
    });
    
    async function demo() {
        try {
            // Create test listing
            const listing = await marketplace.createListing('seller_001', 'loop_market_test_001', {
                price: 250,
                title: 'Premium Consciousness Loop',
                description: 'A highly resonant loop for deep consciousness exploration',
                tags: ['consciousness', 'premium', 'blessed'],
                allow_commercial_license: true
            });
            
            // Search marketplace
            console.log('\n🔍 Search results for "consciousness":');
            const results = await marketplace.searchListings('consciousness', {
                min_price: 100,
                max_price: 500
            });
            results.forEach(r => {
                console.log(`  - ${r.metadata.title}: ${r.pricing.base_price} credits`);
            });
            
            // Simulate purchase
            const purchase = await marketplace.purchaseLoop(
                'buyer_001',
                listing.listing_id,
                'personal'
            );
            
            console.log('\n✅ Purchase complete:');
            console.log(`  Transaction: ${purchase.transaction.transaction_id}`);
            console.log(`  License: ${purchase.license.license_id}`);
            
            // Get seller revenue
            const revenue = marketplace.getSellerRevenue('seller_001');
            console.log('\n💰 Seller revenue:', revenue);
            
            // Get marketplace stats
            console.log('\n📊 Marketplace Stats:');
            console.log(marketplace.getMarketplaceStats());
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}