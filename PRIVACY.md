# Privacy Policy

**Last updated:** January 2026

## Overview

CodeMind is a browser extension that provides AI-powered analysis of GitHub repositories. We are committed to protecting your privacy.

## Data Collection

### What We Collect
- **API Keys:** Stored locally in your browser using Chrome's storage API. Never transmitted to our servers.
- **Repository Data:** Temporarily fetched from GitHub for analysis. Not stored permanently.
- **Cached Analyses:** Stored locally and automatically expire after 24 hours.

### What We Don't Collect
- Personal information
- Browsing history
- Analytics or tracking data
- Usage statistics

## Data Storage

All data is stored **locally on your device**:
- Settings and API keys are stored in `chrome.storage.sync` (synced across your Chrome instances only)
- Cached analyses are stored in `chrome.storage.local` and automatically expire after 24 hours

## Third-Party Services

CodeMind connects to:
1. **GitHub** - To fetch public repository information (no authentication required)
2. **AI Providers** (user-selected):
   - Google Gemini API
   - OpenAI API
   - Anthropic Claude API
   - HuggingFace Inference API
   - OpenRouter API

Your API keys are sent directly from your browser to these services. We do not proxy or store these requests.

## Data Security

- API keys are stored securely in your browser's extension storage
- All API communications use HTTPS encryption
- No data is transmitted to CodeMind servers (we don't have any)

## Your Rights

You can:
- Clear cached data anytime via the extension settings
- Remove your API keys at any time
- Uninstall the extension to remove all stored data

## Changes

We may update this policy. Check this page for the latest version.

## Contact

For questions about this privacy policy, open an issue on our GitHub repository.
