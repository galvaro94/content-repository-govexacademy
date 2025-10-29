# Local Development Setup

## For Testing Claude API Locally

When developing locally, you have two options to add your Claude API key:

### Option 1: Environment Variable (Recommended)
1. Create a `.env` file in your project root:
   ```
   CLAUDE_API_KEY=your-actual-api-key-here
   ```
2. Add `.env` to your `.gitignore` file (already done)
3. The config.js will automatically pick it up

### Option 2: Temporary Local Config
1. Open `config.js`
2. Temporarily replace the apiKey line:
   ```javascript
   // TEMPORARY - FOR LOCAL TESTING ONLY
   apiKey: 'your-actual-api-key-here'
   ```
3. **⚠️ IMPORTANT**: Never commit this change to git!
4. Use `git stash` to temporarily save changes without committing

### Testing Without API Key
- The system has a fallback mode
- It will use the existing rule-based responses
- You'll see a debug message in console if no API key is detected

### Security Reminders
- ✅ API key is in GitHub Secrets (production)
- ✅ API key in .env file (local development)
- ❌ Never put API key directly in source code
- ❌ Never commit .env file to git
- ❌ Never share your API key publicly