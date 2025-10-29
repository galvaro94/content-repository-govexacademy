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
        // Dynamic API key getter that checks for injected key
        get apiKey() {
            return window.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY || null;
        },
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

// Function to validate and log configuration
function validateAndLogConfig() {
    const apiKey = CONFIG.claude.apiKey;

    // Validate API key format
    if (apiKey && !apiKey.startsWith('sk-ant-')) {
        console.warn('⚠️ Invalid Claude API key format detected');
        return false;
    }

    // Debug information
    if (CONFIG.features.debugMode || CONFIG.environment === 'production') {
        console.log('🔧 App Configuration:', {
            environment: CONFIG.environment,
            hasApiKey: !!apiKey,
            keyPreview: apiKey ? `${apiKey.substring(0, 12)}...` : 'None',
            model: CONFIG.claude.models[CONFIG.environment],
            features: CONFIG.features,
            timestamp: new Date().toISOString()
        });
    }

    return !!apiKey;
}

// Export configuration
window.APP_CONFIG = CONFIG;

// Initial validation
validateAndLogConfig();

// Re-validate after DOM loads (in case API key was injected later)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            const hasKey = validateAndLogConfig();
            if (hasKey) {
                console.log('✅ Claude API key loaded successfully');
            } else {
                console.warn('⚠️ Claude API key not found - using fallback mode');
            }
        }, 100);
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        const hasKey = validateAndLogConfig();
        if (hasKey) {
            console.log('✅ Claude API key loaded successfully');
        } else {
            console.warn('⚠️ Claude API key not found - using fallback mode');
        }
    }, 100);
}