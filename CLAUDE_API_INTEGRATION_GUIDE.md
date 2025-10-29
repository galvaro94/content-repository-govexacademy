# Claude API Integration Guide for GovEx Academy AI Assistant

## Overview
This guide provides step-by-step instructions to integrate Claude AI API into the existing AI assistant, replacing the current rule-based system with actual AI-powered responses that can understand and analyze website data.

## Prerequisites
- Claude API key from Anthropic
- Understanding of JavaScript/React
- Access to the GovEx Academy codebase

## Current State Analysis
The current AI assistant (`AIChatbot` component at line 6649) uses:
- Rule-based pattern matching in `getAIResponse()` function
- Static predefined responses
- Local data processing only
- No external API calls

## Step-by-Step Integration

### Step 1: Add Claude API Configuration

**Location**: Near the top of `index.html` (around line 40-50, after Google Sheets config)

```javascript
// Claude AI API Configuration
const CLAUDE_API_CONFIG = {
    API_KEY: 'YOUR_CLAUDE_API_KEY_HERE', // Replace with your actual API key
    API_URL: 'https://api.anthropic.com/v1/messages',
    MODEL: 'claude-3-sonnet-20240229', // or claude-3-haiku-20240307 for faster responses
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};
```

### Step 2: Create Claude API Service Function

**Location**: After the Google Sheets configuration section (around line 2000)

```javascript
// Claude AI Service
const ClaudeAIService = {
    async sendMessage(userMessage, context = {}) {
        try {
            // Prepare context about the website data
            const systemPrompt = this.buildSystemPrompt(context);

            const requestBody = {
                model: CLAUDE_API_CONFIG.MODEL,
                max_tokens: CLAUDE_API_CONFIG.MAX_TOKENS,
                temperature: CLAUDE_API_CONFIG.TEMPERATURE,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userMessage
                    }
                ]
            };

            const response = await fetch(CLAUDE_API_CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CLAUDE_API_CONFIG.API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return {
                message: data.content[0].text,
                success: true
            };
        } catch (error) {
            console.error('Claude API Error:', error);
            return {
                message: "I'm having trouble connecting to my AI services right now. Let me try to help you with my basic knowledge instead.",
                success: false,
                fallback: true
            };
        }
    },

    buildSystemPrompt(context) {
        const { resources = [], programs = [], currentUser = {}, totalStats = {} } = context;

        return `You are the GovEx Academy AI Assistant, helping users navigate and find resources in a government excellence training platform.

CURRENT WEBSITE DATA:
- Total Resources: ${resources.length}
- Available Programs: ${programs.map(p => p.name).join(', ')}
- User Role: ${currentUser.role || 'Unknown'}
- User Name: ${currentUser.name || 'Unknown'}

RESOURCE CATEGORIES AVAILABLE:
${this.getResourceSummary(resources)}

CAPABILITIES:
- Answer questions about available resources
- Help users find specific content
- Provide statistics about the platform
- Guide users through the interface
- Suggest relevant resources based on queries

RESPONSE GUIDELINES:
- Be concise and helpful
- Use bullet points and formatting for clarity
- Suggest specific actions when relevant
- Reference actual data from the platform
- Be conversational but professional
- If asked about resources, provide specific examples from the data

WEBSITE STRUCTURE:
- Main dashboard with resource cards
- Left sidebar with filters (programs, topics, file types, authors)
- Search functionality in the header
- Right sidebar with statistics
- Admin users can manage resources, regular users can request new ones`;
    },

    getResourceSummary(resources) {
        if (!resources.length) return "No resources currently available.";

        // Analyze actual resource data
        const topics = [...new Set(resources.flatMap(r => r.tags || r.topics || []))].slice(0, 10);
        const fileTypes = [...new Set(resources.map(r => r.fileType).filter(Boolean))];
        const programs = [...new Set(resources.flatMap(r => r.programsUsed || []))].slice(0, 5);
        const authors = [...new Set(resources.flatMap(r => r.authors || []))].slice(0, 5);

        return `- Topics: ${topics.join(', ')}
- File Types: ${fileTypes.join(', ')}
- Programs: ${programs.join(', ')}
- Top Authors: ${authors.join(', ')}`;
    }
};
```

### Step 3: Update the AI Response Function

**Location**: Replace the existing `getAIResponse` function in the `AIChatbot` component (around line 6681)

```javascript
// Enhanced AI response function with Claude API integration
const getAIResponse = async (userMessage) => {
    // Prepare context for Claude
    const context = {
        resources,
        programs,
        currentUser,
        selectedFilters,
        totalStats: {
            total: resources.length,
            govex: resources.filter(r => r.govexOrExternal === 'GovEx').length,
            external: resources.filter(r => r.govexOrExternal === 'External').length,
            fillable: resources.filter(r => r.fillable).length
        }
    };

    // Try Claude AI first
    const claudeResponse = await ClaudeAIService.sendMessage(userMessage, context);

    if (claudeResponse.success) {
        return {
            message: claudeResponse.message,
            actions: [], // Could be enhanced to parse actions from Claude response
            source: 'claude'
        };
    }

    // Fallback to existing rule-based system
    return getFallbackResponse(userMessage);
};

// Keep existing rule-based logic as fallback
const getFallbackResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    // [Keep your existing getAIResponse logic here as fallback]
    // This ensures the assistant still works if Claude API is unavailable

    // Navigation help
    if (message.includes('navigate') || message.includes('how to use') || message.includes('help')) {
        return {
            message: "I can help you navigate the dashboard! Here are the main areas:\\n\\n📊 **Left Sidebar**: Filter resources by programs, topics, authors, file types, and more\\n📋 **Main Area**: Browse resource cards with download links\\n📈 **Right Sidebar**: View quick stats and recent activity\\n\\nWhat would you like to explore?",
            actions: [],
            source: 'fallback'
        };
    }

    // [Include other existing response patterns here...]

    // Default fallback
    return {
        message: "I can help you search! Try asking me:\\n\\n🔍 \\"Find resources about data quality\\"\\n📁 \\"Show me Excel files\\"\\n🏢 \\"What's available from GovEx?\\"\\n👥 \\"Resources by author name\\"\\n\\nWhat are you looking for?",
        actions: [],
        source: 'fallback'
    };
};
```

### Step 4: Update the handleSendMessage Function

**Location**: Modify the existing `handleSendMessage` function (around line 6884)

```javascript
const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
        id: Date.now(),
        type: 'user',
        message: inputMessage,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
        // Get AI response (now async with Claude integration)
        const aiResponse = await getAIResponse(inputMessage);

        const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            message: aiResponse.message,
            timestamp: new Date(),
            source: aiResponse.source || 'unknown'
        };

        setMessages(prev => [...prev, botMessage]);

        // Execute any actions
        if (aiResponse.actions && aiResponse.actions.length > 0) {
            aiResponse.actions.forEach(action => {
                if (action.type === 'filter') {
                    setSelectedFilters(prev => ({
                        ...prev,
                        [action.filter]: action.values
                    }));
                } else if (action.type === 'search') {
                    setSearchQuery(action.query);
                }
            });
        }
    } catch (error) {
        console.error('Error getting AI response:', error);

        const errorMessage = {
            id: Date.now() + 1,
            type: 'bot',
            message: "I'm sorry, I encountered an error while processing your request. Please try again or rephrase your question.",
            timestamp: new Date(),
            source: 'error'
        };

        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsTyping(false);
    }
};
```

### Step 5: Add Environment Configuration (Optional but Recommended)

**Create a new section** at the top of the file for environment-based configuration:

```javascript
// Environment Configuration
const ENV_CONFIG = {
    // Set to 'development' for testing, 'production' for live
    MODE: 'development',

    // Feature flags
    FEATURES: {
        CLAUDE_AI_ENABLED: true,
        FALLBACK_ENABLED: true,
        DEBUG_MODE: true
    },

    // API configurations based on environment
    CLAUDE_API: {
        development: {
            API_KEY: 'YOUR_DEVELOPMENT_CLAUDE_API_KEY',
            MODEL: 'claude-3-haiku-20240307', // Faster/cheaper for dev
            MAX_TOKENS: 500
        },
        production: {
            API_KEY: 'YOUR_PRODUCTION_CLAUDE_API_KEY',
            MODEL: 'claude-3-sonnet-20240229', // Better quality for prod
            MAX_TOKENS: 1000
        }
    }
};

// Use environment-specific config
const CLAUDE_API_CONFIG = {
    ...ENV_CONFIG.CLAUDE_API[ENV_CONFIG.MODE],
    API_URL: 'https://api.anthropic.com/v1/messages',
    TEMPERATURE: 0.7
};
```

### Step 6: Add Debug Information (Development Only)

**Update the message display** to show which AI system generated the response:

```javascript
// In the message rendering section, add source indicator for development
{message.source && ENV_CONFIG.FEATURES.DEBUG_MODE && (
    <div className="text-xs text-[#8b949e] mt-1">
        Source: {message.source === 'claude' ? '🤖 Claude AI' : '⚙️ Fallback'}
    </div>
)}
```

### Step 7: Error Handling and Rate Limiting

**Add to ClaudeAIService**:

```javascript
// Add to ClaudeAIService object
rateLimitTracker: {
    requests: 0,
    lastReset: Date.now(),
    maxRequests: 60 // per minute
},

checkRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - this.rateLimitTracker.lastReset > oneMinute) {
        this.rateLimitTracker.requests = 0;
        this.rateLimitTracker.lastReset = now;
    }

    if (this.rateLimitTracker.requests >= this.rateLimitTracker.maxRequests) {
        throw new Error('Rate limit exceeded. Please wait a moment before asking another question.');
    }

    this.rateLimitTracker.requests++;
},

async sendMessage(userMessage, context = {}) {
    try {
        // Check rate limit first
        this.checkRateLimit();

        // [Rest of the existing sendMessage code...]
    } catch (error) {
        // [Existing error handling...]
    }
}
```

## Security Considerations

### 1. API Key Management
- **Never commit API keys to version control**
- Store in environment variables or secure configuration
- Use different keys for development and production
- Consider using a backend proxy to hide the API key

### 2. Input Sanitization
```javascript
// Add input validation before sending to Claude
const sanitizeInput = (input) => {
    // Remove potentially harmful content
    return input
        .replace(/[<>]/g, '') // Basic XSS prevention
        .trim()
        .slice(0, 2000); // Limit input length
};

// Use in getAIResponse:
const sanitizedMessage = sanitizeInput(userMessage);
```

### 3. Response Filtering
```javascript
// Add response validation
const validateResponse = (response) => {
    // Check for inappropriate content, malformed responses, etc.
    if (response.length > 5000) {
        return "Response was too long. Please ask a more specific question.";
    }
    return response;
};
```

## Testing Strategy

### 1. Development Testing
1. Test with your development API key
2. Try various question types:
   - Simple resource searches
   - Complex queries about the data
   - Navigation help
   - Statistics requests
   - Edge cases and errors

### 2. Fallback Testing
1. Temporarily disable Claude API (comment out API key)
2. Verify fallback system works correctly
3. Test error scenarios

### 3. Rate Limiting Testing
1. Send multiple rapid requests
2. Verify rate limiting works
3. Test recovery after rate limit

## Deployment Steps

### 1. Development Deployment
1. Add your development Claude API key
2. Set `ENV_CONFIG.MODE = 'development'`
3. Enable debug mode
4. Test thoroughly

### 2. Production Deployment
1. Add production Claude API key
2. Set `ENV_CONFIG.MODE = 'production'`
3. Disable debug mode
4. Monitor usage and costs

## Monitoring and Maintenance

### 1. Usage Tracking
```javascript
// Add to ClaudeAIService
logUsage(userMessage, response, success) {
    if (ENV_CONFIG.FEATURES.DEBUG_MODE) {
        console.log('Claude API Usage:', {
            timestamp: new Date().toISOString(),
            inputLength: userMessage.length,
            outputLength: response.length,
            success,
            tokens: response.length * 0.75 // Rough estimate
        });
    }
}
```

### 2. Error Monitoring
```javascript
// Add comprehensive error logging
logError(error, context) {
    console.error('Claude AI Error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
        context,
        stack: error.stack
    });

    // Could send to monitoring service in production
}
```

## Cost Optimization

### 1. Model Selection
- Use `claude-3-haiku-20240307` for development (faster, cheaper)
- Use `claude-3-sonnet-20240229` for production (better quality)
- Consider `claude-3-opus-20240229` only for complex analysis

### 2. Token Management
- Limit response length with `MAX_TOKENS`
- Keep system prompts concise
- Implement conversation context management

### 3. Caching (Optional Enhancement)
```javascript
// Simple response caching
const responseCache = new Map();

const getCachedResponse = (userMessage) => {
    const cacheKey = userMessage.toLowerCase().trim();
    return responseCache.get(cacheKey);
};

const setCachedResponse = (userMessage, response) => {
    const cacheKey = userMessage.toLowerCase().trim();
    responseCache.set(cacheKey, response);

    // Limit cache size
    if (responseCache.size > 100) {
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
    }
};
```

## Final Integration Checklist

- [ ] Add Claude API configuration section
- [ ] Implement ClaudeAIService with all methods
- [ ] Update getAIResponse to use Claude API
- [ ] Modify handleSendMessage for async operation
- [ ] Add error handling and fallback logic
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Set up environment configuration
- [ ] Add debug information for development
- [ ] Test with various question types
- [ ] Test fallback functionality
- [ ] Verify error handling
- [ ] Test rate limiting
- [ ] Deploy to development environment
- [ ] Monitor usage and costs
- [ ] Deploy to production

## Example Questions to Test

After integration, test with these example questions:

1. **Resource Discovery**: "Find me resources about data quality"
2. **Statistics**: "How many resources do we have?"
3. **Specific Content**: "Show me Excel templates I can fill out"
4. **Navigation**: "How do I add a new resource?"
5. **Complex Queries**: "What resources would help a city manager improve transparency?"
6. **Data Analysis**: "Which topics have the most resources?"

## Support and Troubleshooting

### Common Issues:
1. **API Key Issues**: Verify key is correct and has proper permissions
2. **Rate Limits**: Implement proper rate limiting and user feedback
3. **Network Errors**: Ensure proper error handling and fallback
4. **Large Responses**: Monitor token usage and implement limits

### Getting Help:
- Check Anthropic's Claude API documentation
- Review error logs and console messages
- Test individual components in isolation
- Use fallback system for debugging

This integration will transform your AI assistant from a rule-based system to a truly intelligent assistant that can understand context, analyze your data, and provide meaningful insights to users.