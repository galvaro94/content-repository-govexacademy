// Environment Configuration for GovEx Academy
// This file safely manages API keys and environment settings

const CONFIG = {
    // Environment detection
    environment: (function() {
        // Check if we're on GitHub Pages
        if (window.location.hostname.includes('github.io') || window.location.hostname.includes('githubusercontent.com')) {
            return 'production';
        }

        // Check if we're on localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'development';
        }

        // Default to production for safety
        return 'production';
    })(),

    // API Configuration
    claude: {
        // GitHub Pages will inject the API key via build process
        // For local development, you'll need to add it manually (see README)
        apiKey: window.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY || null,
        apiUrl: 'https://api.anthropic.com/v1/messages',
        models: {
            development: 'claude-3-haiku-20240307',  // Faster, cheaper for dev
            production: 'claude-3-sonnet-20240229'   // Better quality for prod
        },
        maxTokens: {
            development: 500,
            production: 1000
        },
        temperature: 0.7
    },

    // Feature flags
    features: {
        claudeAI: true,
        fallbackMode: true,
        debugMode: false  // Will be set to true for development
    },

    // Rate limiting
    rateLimits: {
        requestsPerMinute: 20,
        requestsPerHour: 100
    }
};

// Set debug mode for development
if (CONFIG.environment === 'development') {
    CONFIG.features.debugMode = true;
}

// Validate configuration
if (CONFIG.claude.apiKey && !CONFIG.claude.apiKey.startsWith('sk-ant-')) {
    console.warn('⚠️ Invalid Claude API key format detected');
    CONFIG.claude.apiKey = null;
}

// Export configuration
window.APP_CONFIG = CONFIG;

// Debug information (development only)
if (CONFIG.features.debugMode) {
    console.log('🔧 App Configuration:', {
        environment: CONFIG.environment,
        hasApiKey: !!CONFIG.claude.apiKey,
        model: CONFIG.claude.models[CONFIG.environment],
        features: CONFIG.features
    });
}