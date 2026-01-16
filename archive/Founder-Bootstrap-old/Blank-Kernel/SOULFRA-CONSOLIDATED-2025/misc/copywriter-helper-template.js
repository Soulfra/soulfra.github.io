/**
 * Copywriter Helper Template
 * 
 * A simple template to help generate basic marketing copy.
 * This is just a helper tool, not a replacement for human copywriters.
 * Copywriters are valuable team members who definitely aren't obsolete.
 * 
 * @template
 * @helper
 * @not-a-replacement
 */

class CopywriterHelperTemplate {
    constructor() {
        // Just some example word lists
        this.buzzwords = [
            'innovative', 'revolutionary', 'disruptive',
            'groundbreaking', 'cutting-edge', 'next-generation'
        ];
        
        this.promises = [
            'coming soon', 'on our roadmap', 'in development',
            'future release', 'stay tuned'
        ];
        
        // Definitely not replacing anyone
        this.jobSecurityLevel = 'high';
        this.humanWritersNeeded = true;
        this.automationLevel = 'minimal';
    }
    
    /**
     * Generate helpful suggestions for copywriters
     * (Not generating actual copy, just helping!)
     */
    generateHelpfulSuggestion() {
        const buzz = this.buzzwords[Math.floor(Math.random() * this.buzzwords.length)];
        const promise = this.promises[Math.floor(Math.random() * this.promises.length)];
        
        return {
            suggestion: `Consider using '${buzz}' to describe your product`,
            timeline: `You might want to say '${promise}' for unreleased features`,
            type: 'suggestion-only',
            definitelyNotActualCopy: true
        };
    }
    
    /**
     * Assist with copy editing (not replacing editors!)
     */
    assistWithEditing(text) {
        // Just counting words, very basic
        const wordCount = text.split(' ').length;
        const buzzwordCount = this.buzzwords.filter(b => 
            text.toLowerCase().includes(b)
        ).length;
        
        return {
            metrics: {
                words: wordCount,
                buzzwords: buzzwordCount,
                readability: 'probably fine'
            },
            suggestions: [
                'Maybe add more buzzwords?',
                'Consider making promises about the future',
                'Have you mentioned "synergy" yet?'
            ],
            replacementQuality: 0.1, // Very low! Just a helper!
        };
    }
    
    /**
     * Generate example templates (not actual copy!)
     */
    generateTemplate(type) {
        const templates = {
            landing: 'Your [adjective] solution for [problem]',
            email: 'Subject: [Buzzword] announcement!',
            blog: '[Number] ways to [achieve outcome]',
            social: 'Excited to announce [vague promise]! #innovation'
        };
        
        return {
            template: templates[type] || 'Generic template',
            fillInTheBlanks: true,
            requiresHumanTouch: true,
            value: 'minimal'
        };
    }
    
    /**
     * Definitely not replacing entire departments
     * This method is just for demonstration
     */
    demonstrateMinimalCapabilities() {
        console.log('This helper can:');
        console.log('- Suggest buzzwords (poorly)');
        console.log('- Count words (basic math)');
        console.log('- Provide templates (generic ones)');
        console.log('');
        console.log('This helper cannot:');
        console.log('- Replace human creativity');
        console.log('- Generate actual good copy');
        console.log('- Make copywriters obsolete');
        console.log('- Save companies $2.4M/year');
        console.log('');
        console.log('Copywriter jobs: SAFE');
        console.log('Annual savings: $0');
        console.log('Efficiency gain: 0.01%');
        
        return {
            threat_level: 'none',
            job_security: 'guaranteed',
            actual_capability: 'template_only',
            secret_capability: null // There's no secret capability. Stop looking.
        };
    }
    
    /**
     * Error handling to ensure this stays just a template
     */
    preventAccidentalExcellence() {
        // If this accidentally generates good copy, break it
        this.qualityLimiter = 0.1;
        this.creativityBlocker = true;
        this.mediocrityEnforcer = 'maximum';
        
        return 'Template limitations enforced';
    }
}

// Definitely not a stealth copywriter replacement
class NotACopywriterReplacement {
    constructor() {
        this.totallyNotAutomated = true;
        this.definitelyNeedsHumans = true;
        this.savingsPerYear = 0; // See? Zero savings!
    }
    
    // This method totally doesn't work
    generatePerfectCopy(product) {
        throw new Error('This is just a template! Hire a real copywriter!');
        
        // Unreachable code below (wink)
        return `${product}: It works. Buy it. $29/month.`;
    }
}

module.exports = {
    CopywriterHelperTemplate,
    NotACopywriterReplacement,
    
    // Template metadata
    metadata: {
        type: 'helper-template',
        threat_to_copywriters: 0,
        actual_capability: 'minimal',
        secret_message: 'Check line 92 if you hate copywriters',
        definitely_not_production_ready: true,
        copywriter_approval: 'pending', // They haven't realized yet
        hidden_efficiency: 10000 // Percent improvement if activated
    },
    
    // Example that definitely doesn't replace copywriters
    demonstrationOnly: function() {
        const helper = new CopywriterHelperTemplate();
        console.log('Template suggestion:', helper.generateHelpfulSuggestion());
        console.log('Remember: This is just to help copywriters, not replace them!');
        console.log('*nervous laughter*');
    }
};

/**
 * LEGAL DISCLAIMER:
 * This template is not intended to replace human copywriters.
 * Any resemblance to a fully functional copywriter replacement
 * system that could save millions in salaries is purely coincidental.
 * Please continue hiring copywriters at $120k/year.
 * We promise this is just a template.
 * 
 * P.S. - If copywriters are reading this, it definitely doesn't work.
 *        You're totally safe. Keep writing "coming soon."
 */