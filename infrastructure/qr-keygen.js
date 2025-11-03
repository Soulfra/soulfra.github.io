const crypto = require('crypto');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

class QRKeyGen {
    constructor() {
        this.vaultPath = path.join(__dirname, 'vault');
        this.ensureVault();
    }

    ensureVault() {
        if (!fs.existsSync(this.vaultPath)) {
            fs.mkdirSync(this.vaultPath, { recursive: true });
        }
    }

    generatePlatformQR(type = 'customer') {
        const timestamp = Date.now();
        const entropy = this.loadVaultEntropy();
        
        // Generate unique QR data
        const qrData = {
            type: type,
            platform: 'mirror-os-user',
            timestamp: timestamp,
            entropy: crypto.createHash('sha256')
                .update(entropy + timestamp + type)
                .digest('hex')
                .substring(0, 16),
            tier: -13, // One deeper than tier -12
            mirror: true
        };

        const qrString = `qr-${type}-${qrData.entropy}`;
        
        return {
            code: qrString,
            data: qrData,
            visual: this.generateVisualQR(qrString)
        };
    }

    loadVaultEntropy() {
        const entropyFile = path.join(this.vaultPath, 'entropy.json');
        
        if (fs.existsSync(entropyFile)) {
            const data = JSON.parse(fs.readFileSync(entropyFile, 'utf8'));
            return data.entropy;
        }
        
        // Generate if doesn't exist
        const entropy = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(entropyFile, JSON.stringify({
            created: new Date().toISOString(),
            entropy: entropy
        }, null, 2));
        
        return entropy;
    }

    async generateVisualQR(data) {
        try {
            // Generate QR code as data URL
            const qrDataUrl = await qrcode.toDataURL(data, {
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 256
            });
            
            // Also save as file
            const qrPath = path.join(this.vaultPath, `qr-${Date.now()}.png`);
            await qrcode.toFile(qrPath, data);
            
            return {
                dataUrl: qrDataUrl,
                filePath: qrPath
            };
        } catch (err) {
            console.error('QR generation error:', err);
            return null;
        }
    }

    generateOwnerQR() {
        const ownerQR = this.generatePlatformQR('owner');
        
        // Save owner QR metadata
        const ownerFile = path.join(this.vaultPath, 'owner-qr.json');
        fs.writeFileSync(ownerFile, JSON.stringify({
            created: new Date().toISOString(),
            qr: ownerQR.code,
            data: ownerQR.data,
            sovereignty: true,
            message: 'This QR grants platform ownership. Guard it carefully.'
        }, null, 2));
        
        console.log('\n🔐 Platform Owner QR Generated:');
        console.log(`   Code: ${ownerQR.code}`);
        console.log(`   Entropy: ${ownerQR.data.entropy}`);
        console.log('   Status: SOVEREIGN\n');
        
        return ownerQR;
    }

    generateCustomerQR(customerId) {
        const customerQR = this.generatePlatformQR('customer');
        
        // Log customer QR
        const customerLog = path.join(this.vaultPath, 'customer-qrs.json');
        let customers = [];
        
        if (fs.existsSync(customerLog)) {
            customers = JSON.parse(fs.readFileSync(customerLog, 'utf8'));
        }
        
        customers.push({
            customerId: customerId || `customer-${Date.now()}`,
            qr: customerQR.code,
            created: new Date().toISOString(),
            data: customerQR.data
        });
        
        fs.writeFileSync(customerLog, JSON.stringify(customers, null, 2));
        
        return customerQR;
    }

    validateQR(qrCode) {
        // Extract type and entropy from QR
        const parts = qrCode.split('-');
        if (parts.length !== 3 || parts[0] !== 'qr') {
            return { valid: false, error: 'Invalid QR format' };
        }
        
        const [, type, entropy] = parts;
        
        // Check owner QR
        const ownerFile = path.join(this.vaultPath, 'owner-qr.json');
        if (fs.existsSync(ownerFile)) {
            const ownerData = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
            if (ownerData.qr === qrCode) {
                return {
                    valid: true,
                    type: 'owner',
                    sovereignty: true,
                    data: ownerData.data
                };
            }
        }
        
        // Check customer QRs
        const customerLog = path.join(this.vaultPath, 'customer-qrs.json');
        if (fs.existsSync(customerLog)) {
            const customers = JSON.parse(fs.readFileSync(customerLog, 'utf8'));
            const customer = customers.find(c => c.qr === qrCode);
            
            if (customer) {
                return {
                    valid: true,
                    type: 'customer',
                    customerId: customer.customerId,
                    data: customer.data
                };
            }
        }
        
        return { valid: false, error: 'QR not found in vault' };
    }
}

// CLI usage
if (require.main === module) {
    const keygen = new QRKeyGen();
    const args = process.argv.slice(2);
    
    if (args.includes('--owner')) {
        keygen.generateOwnerQR();
    } else if (args.includes('--customer')) {
        const customerId = args[args.indexOf('--customer') + 1];
        const qr = keygen.generateCustomerQR(customerId);
        console.log('Customer QR generated:', qr.code);
    } else if (args.includes('--validate')) {
        const qrCode = args[args.indexOf('--validate') + 1];
        const result = keygen.validateQR(qrCode);
        console.log('Validation result:', result);
    } else {
        console.log('Usage:');
        console.log('  node qr-keygen.js --owner              Generate platform owner QR');
        console.log('  node qr-keygen.js --customer [id]      Generate customer QR');
        console.log('  node qr-keygen.js --validate [qr]      Validate QR code');
    }
}

module.exports = QRKeyGen;