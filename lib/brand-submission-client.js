/**
 * Brand Submission Client
 *
 * Client-side library for submitting brand intake forms.
 * Creates a GitHub Issue with [BRAND_SUBMISSION] prefix to trigger
 * the brand-page-generator GitHub Action workflow.
 *
 * Usage:
 *   <script src="/lib/brand-submission-client.js"></script>
 *   <script>
 *     const client = new BrandSubmissionClient({
 *       owner: 'soulfra',
 *       repo: 'soulfra.github.io',
 *       githubToken: 'optional-for-anonymous-submissions'
 *     });
 *
 *     client.submit({
 *       brandName: 'MyBrand',
 *       brandSlug: 'mybrand',
 *       xHandle: '@mybrand',
 *       contactEmail: 'contact@mybrand.com'
 *     });
 *   </script>
 */

class BrandSubmissionClient {
  constructor(options = {}) {
    this.owner = options.owner || 'soulfra';
    this.repo = options.repo || 'soulfra.github.io';
    this.githubToken = options.githubToken || null;
    this.apiBase = 'https://api.github.com';
  }

  /**
   * Submit brand intake form (creates GitHub Issue)
   * @param {Object} formData - Brand submission data
   * @returns {Promise<Object>} - Submission result
   */
  async submit(formData) {
    // Validate data
    this.validate(formData);

    // Prepare submission data
    const submission = this.prepareSubmission(formData);

    // Create GitHub Issue
    const issue = await this.createGitHubIssue(submission);

    return {
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      submission: submission,
      message: 'Brand submission created! Your brand page will be generated automatically.'
    };
  }

  /**
   * Validate submission data
   */
  validate(data) {
    const required = ['brandName', 'brandSlug', 'xHandle', 'contactEmail'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contactEmail)) {
      throw new Error('Invalid email address format');
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(data.brandSlug)) {
      throw new Error('Brand slug must be lowercase, alphanumeric, hyphens only (e.g., my-brand)');
    }

    // Validate X handle
    if (!data.xHandle.startsWith('@')) {
      data.xHandle = '@' + data.xHandle;
    }
  }

  /**
   * Prepare submission data with defaults
   */
  prepareSubmission(data) {
    return {
      brandName: data.brandName,
      brandSlug: data.brandSlug.toLowerCase(),
      brandTagline: data.brandTagline || 'Building in public',
      brandDescription: data.brandDescription || '',
      brandMission: data.brandMission || '',
      brandCategory: data.brandCategory || 'platform',
      brandImpact: data.brandImpact || 'solve real problems',
      xHandle: data.xHandle,
      contactEmail: data.contactEmail,
      whyWorthMillions: data.whyWorthMillions || '',
      securityNeed: data.security_need || '',
      referralSource: data.referral || '',
      additionalMessage: data.message || '',
      submittedAt: new Date().toISOString()
    };
  }

  /**
   * Create GitHub Issue with submission data
   */
  async createGitHubIssue(submission) {
    const title = `[BRAND_SUBMISSION] ${submission.brandName}`;
    const body = this.formatIssueBody(submission);

    const headers = {
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };

    if (this.githubToken) {
      headers['Authorization'] = `Bearer ${this.githubToken}`;
    }

    const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        title: title,
        body: body,
        labels: ['brand-submission', 'automation']
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Format issue body with submission data
   */
  formatIssueBody(submission) {
    return `## Brand Submission

**Brand Name:** ${submission.brandName}
**Brand Slug:** ${submission.brandSlug}
**Tagline:** ${submission.brandTagline}
**X Handle:** ${submission.xHandle}
**Contact Email:** ${submission.contactEmail}

---

### Submission Data (JSON)

\`\`\`json
${JSON.stringify(submission, null, 2)}
\`\`\`

---

**Submitted At:** ${submission.submittedAt}

---

### What happens next?

1. ✅ This issue triggers the brand page generator workflow
2. 🎨 Your brand pages (about, privacy, terms) will be generated automatically
3. 🌐 Your page will be live at: https://soulfra.github.io/brands/${submission.brandSlug}/
4. 📧 You'll be notified when generation is complete

Thank you for joining the ecosystem!`;
  }
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrandSubmissionClient;
}
