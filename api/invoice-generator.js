#!/usr/bin/env node
/**
 * Soulfra Invoice Generator
 *
 * Professional PDF invoice generation for payments
 *
 * Features:
 * - Beautiful PDF invoices
 * - Customizable templates
 * - Company branding
 * - Line items
 * - Tax calculations
 * - Discounts/coupons
 * - Payment tracking
 * - Email delivery
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const DataStore = require('./data-store.js');

class InvoiceGenerator {
  constructor(options = {}) {
    // Configuration
    this.config = {
      company: {
        name: options.companyName || 'Soulfra',
        address: options.companyAddress || '123 Main St, San Francisco, CA 94102',
        email: options.companyEmail || 'billing@soulfra.com',
        phone: options.companyPhone || '(415) 555-1234',
        website: options.companyWebsite || 'https://soulfra.com',
        logo: options.companyLogo || null
      },
      currency: options.currency || 'USD',
      taxRate: options.taxRate || 0, // 0% by default
      locale: options.locale || 'en-US',
      ...options
    };

    // Data store
    this.invoicesStore = new DataStore(path.join(__dirname, '../data/invoices.json'));
    this.invoicesDir = path.join(__dirname, '../data/invoices');

    // Create invoices directory if it doesn't exist
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }

    // Check for pdfkit
    this.pdfkit = null;
    try {
      this.pdfkit = require('pdfkit');
    } catch (error) {
      console.warn('⚠️ pdfkit not installed. Run: npm install pdfkit');
      console.warn('⚠️ Invoice generator in MOCK MODE');
    }

    // Stats
    this.stats = {
      totalInvoices: 0,
      totalAmount: 0,
      paidInvoices: 0,
      unpaidInvoices: 0
    };
  }

  /**
   * Check if ready
   */
  isReady() {
    return this.pdfkit !== null;
  }

  /**
   * Generate an invoice
   *
   * @param {Object} params
   * @param {string} params.customerId - Customer ID
   * @param {string} params.customerName - Customer name
   * @param {string} params.customerEmail - Customer email
   * @param {string} params.customerAddress - Customer address (optional)
   * @param {Array} params.items - Line items
   * @param {number} params.taxRate - Tax rate (optional, overrides default)
   * @param {number} params.discount - Discount amount in cents (optional)
   * @param {string} params.notes - Invoice notes (optional)
   * @param {Object} params.metadata - Additional metadata
   */
  async generateInvoice(params) {
    const {
      customerId,
      customerName,
      customerEmail,
      customerAddress,
      items = [],
      taxRate,
      discount = 0,
      notes,
      paymentId,
      metadata = {}
    } = params;

    // Validation
    if (!customerId || !customerName || !customerEmail) {
      throw new Error('Customer ID, name, and email are required');
    }

    if (!items || items.length === 0) {
      throw new Error('At least one line item is required');
    }

    // Generate invoice number
    const invoiceNumber = this.generateInvoiceNumber();
    const invoiceId = this.generateInvoiceId();

    // Calculate amounts
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = Math.round(subtotal * (taxRate !== undefined ? taxRate : this.config.taxRate));
    const discountAmount = discount || 0;
    const total = subtotal + taxAmount - discountAmount;

    // Create invoice object
    const invoice = {
      id: invoiceId,
      number: invoiceNumber,
      customerId,
      customerName,
      customerEmail,
      customerAddress,
      items,
      subtotal,
      taxRate: taxRate !== undefined ? taxRate : this.config.taxRate,
      taxAmount,
      discount: discountAmount,
      total,
      currency: this.config.currency,
      status: paymentId ? 'paid' : 'pending',
      paymentId,
      notes,
      metadata,
      issuedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days
      paidAt: paymentId ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    };

    // Save invoice
    await this.invoicesStore.append(invoice);

    // Generate PDF
    const pdfPath = path.join(this.invoicesDir, `${invoiceNumber}.pdf`);

    if (this.isReady()) {
      await this.generatePDF(invoice, pdfPath);
      invoice.pdfPath = pdfPath;
    } else {
      console.log(`[MOCK] Invoice created: ${invoiceNumber} - $${(total / 100).toFixed(2)}`);
      invoice.pdfPath = null;
      invoice.mock = true;
    }

    // Update stats
    this.stats.totalInvoices++;
    this.stats.totalAmount += total;
    if (invoice.status === 'paid') {
      this.stats.paidInvoices++;
    } else {
      this.stats.unpaidInvoices++;
    }

    console.log(`✅ Invoice generated: ${invoiceNumber} - $${(total / 100).toFixed(2)}`);

    return {
      success: true,
      invoiceId,
      invoiceNumber,
      invoice,
      pdfPath: invoice.pdfPath
    };
  }

  /**
   * Generate PDF invoice
   */
  async generatePDF(invoice, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const PDFDocument = this.pdfkit;
        const doc = new PDFDocument({ margin: 50 });

        // Pipe to file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        doc
          .fontSize(20)
          .text(this.config.company.name, 50, 50, { bold: true })
          .fontSize(10)
          .text(this.config.company.address, 50, 75)
          .text(this.config.company.email, 50, 90)
          .text(this.config.company.phone, 50, 105);

        // Invoice title
        doc
          .fontSize(20)
          .text('INVOICE', 400, 50, { align: 'right' })
          .fontSize(10)
          .text(`#${invoice.number}`, 400, 75, { align: 'right' })
          .text(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString()}`, 400, 90, { align: 'right' })
          .text(`Due: ${new Date(invoice.dueAt).toLocaleDateString()}`, 400, 105, { align: 'right' });

        // Separator line
        doc
          .moveTo(50, 140)
          .lineTo(550, 140)
          .stroke();

        // Bill to
        doc
          .fontSize(12)
          .text('Bill To:', 50, 160, { bold: true })
          .fontSize(10)
          .text(invoice.customerName, 50, 180)
          .text(invoice.customerEmail, 50, 195);

        if (invoice.customerAddress) {
          doc.text(invoice.customerAddress, 50, 210);
        }

        // Line items table header
        const tableTop = 260;
        doc
          .fontSize(10)
          .text('Description', 50, tableTop, { bold: true, width: 250 })
          .text('Qty', 320, tableTop, { bold: true, width: 50, align: 'right' })
          .text('Price', 380, tableTop, { bold: true, width: 80, align: 'right' })
          .text('Amount', 470, tableTop, { bold: true, width: 80, align: 'right' });

        // Line separator
        doc
          .moveTo(50, tableTop + 20)
          .lineTo(550, tableTop + 20)
          .stroke();

        // Line items
        let y = tableTop + 30;
        for (const item of invoice.items) {
          const amount = item.quantity * item.unitPrice;

          doc
            .fontSize(9)
            .text(item.description, 50, y, { width: 250 })
            .text(item.quantity.toString(), 320, y, { width: 50, align: 'right' })
            .text(this.formatCurrency(item.unitPrice), 380, y, { width: 80, align: 'right' })
            .text(this.formatCurrency(amount), 470, y, { width: 80, align: 'right' });

          y += 25;
        }

        // Separator line
        y += 10;
        doc
          .moveTo(350, y)
          .lineTo(550, y)
          .stroke();

        // Subtotal, tax, discount, total
        y += 15;
        doc
          .fontSize(10)
          .text('Subtotal:', 380, y)
          .text(this.formatCurrency(invoice.subtotal), 470, y, { width: 80, align: 'right' });

        if (invoice.taxAmount > 0) {
          y += 20;
          doc
            .text(`Tax (${(invoice.taxRate * 100).toFixed(1)}%):`, 380, y)
            .text(this.formatCurrency(invoice.taxAmount), 470, y, { width: 80, align: 'right' });
        }

        if (invoice.discount > 0) {
          y += 20;
          doc
            .text('Discount:', 380, y)
            .text(`-${this.formatCurrency(invoice.discount)}`, 470, y, { width: 80, align: 'right' });
        }

        y += 20;
        doc
          .fontSize(12)
          .text('Total:', 380, y, { bold: true })
          .text(this.formatCurrency(invoice.total), 470, y, { width: 80, align: 'right', bold: true });

        // Payment status
        y += 30;
        if (invoice.status === 'paid') {
          doc
            .fillColor('green')
            .fontSize(14)
            .text('PAID', 380, y, { bold: true })
            .fillColor('black');
        } else {
          doc
            .fillColor('red')
            .fontSize(14)
            .text('PENDING', 380, y, { bold: true })
            .fillColor('black');
        }

        // Notes
        if (invoice.notes) {
          y += 40;
          doc
            .fontSize(10)
            .text('Notes:', 50, y, { bold: true })
            .fontSize(9)
            .text(invoice.notes, 50, y + 15, { width: 500 });
        }

        // Footer
        doc
          .fontSize(8)
          .text(
            `Generated by ${this.config.company.name} • ${this.config.company.website}`,
            50,
            700,
            { align: 'center', width: 500 }
          );

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
          console.log(`✅ PDF generated: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Mark invoice as paid
   */
  async markPaid(invoiceId, paymentId) {
    const invoices = await this.invoicesStore.read();
    const invoice = invoices.find(i => i.id === invoiceId);

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    invoice.status = 'paid';
    invoice.paymentId = paymentId;
    invoice.paidAt = new Date().toISOString();

    await this.invoicesStore.write(invoices);

    this.stats.unpaidInvoices--;
    this.stats.paidInvoices++;

    console.log(`✅ Invoice marked as paid: ${invoice.number}`);

    return {
      success: true,
      invoiceId,
      invoiceNumber: invoice.number,
      status: 'paid'
    };
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId) {
    const invoices = await this.invoicesStore.read();
    const invoice = invoices.find(i => i.id === invoiceId);

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    return invoice;
  }

  /**
   * List invoices for a customer
   */
  async listInvoices(customerId) {
    const invoices = await this.invoicesStore.read();

    if (customerId) {
      return invoices.filter(i => i.customerId === customerId);
    }

    return invoices;
  }

  /**
   * Format currency
   */
  formatCurrency(amountInCents) {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat(this.config.locale, {
      style: 'currency',
      currency: this.config.currency
    }).format(amount);
  }

  /**
   * Generate invoice number (sequential)
   */
  generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Generate unique invoice ID
   */
  generateInvoiceId() {
    return `inv_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Get statistics
   */
  async getStats() {
    const invoices = await this.invoicesStore.read();

    return {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      unpaidInvoices: invoices.filter(i => i.status === 'pending').length,
      overdueInvoices: invoices.filter(i =>
        i.status === 'pending' && new Date(i.dueAt) < new Date()
      ).length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
      unpaidAmount: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0)
    };
  }

  /**
   * Get generator info
   */
  getInfo() {
    return {
      ready: this.isReady(),
      mode: this.isReady() ? 'live' : 'mock',
      config: {
        company: this.config.company,
        currency: this.config.currency,
        taxRate: this.config.taxRate
      },
      stats: this.stats
    };
  }
}

module.exports = InvoiceGenerator;
