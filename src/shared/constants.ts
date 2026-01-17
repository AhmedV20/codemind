import { AIProvider, ExtensionSettings } from './types';

// Default settings for new users
export const DEFAULT_SETTINGS: ExtensionSettings = {
    ai: {
        selectedProvider: AIProvider.GEMINI, // Gemini has free tier
        providers: {
            [AIProvider.CLAUDE]: {
                apiKey: '',
                model: 'claude-sonnet-4-20250514',
            },
            [AIProvider.GEMINI]: {
                apiKey: '',
                model: 'gemini-2.0-flash',
            },
            [AIProvider.HUGGINGFACE]: {
                apiKey: '',
                model: 'openai/gpt-oss-20b',
            },
            [AIProvider.OPENROUTER]: {
                apiKey: '',
                model: 'google/gemini-2.0-flash-exp:free',
            },
        },
    },
    analysis: {
        depth: 'standard',
        autoAnalyze: false,
        cacheDuration: 24, // 24 hours
    },
    ui: {
        panelPosition: 'right',
        theme: 'auto',
        fontSize: 'medium',
    },
    github: {
        token: '',
    },
};

// API endpoints
export const API_ENDPOINTS = {
    GITHUB_API: 'https://api.github.com',
    CLAUDE_API: 'https://api.anthropic.com/v1',
    GEMINI_API: 'https://generativelanguage.googleapis.com/v1beta',
    HUGGINGFACE_API: 'https://router.huggingface.co/v1',
    OPENROUTER_API: 'https://openrouter.ai/api/v1',
};

// Storage keys
export const STORAGE_KEYS = {
    SETTINGS: 'github-ai-analyzer-settings',
    CACHE_PREFIX: 'github-ai-analyzer-cache:',
    CONVERSATION_PREFIX: 'github-ai-analyzer-conversation:',
};

// Analysis prompt template
export const ANALYSIS_PROMPT_TEMPLATE = `You are a helpful assistant that explains GitHub repositories to non-technical users in simple, accessible language.

Analyze this repository and provide a comprehensive summary:

**Repository Information:**
- Name: {{repoName}}
- Description: {{description}}
- Primary Language: {{language}}
- Stars: {{stars}} | Forks: {{forks}}
- Last Updated: {{lastUpdate}}
- License: {{license}}

**README Content:**
{{readme}}

**File Structure (top-level):**
{{structure}}

{{#if releases}}
**Latest Release:** {{latestRelease}}
{{/if}}

Please provide a summary with the following sections:

## 📊 Quick Summary
A brief 2-3 sentence overview of what this project is.

## 🎯 What It Does
Explain the core purpose and functionality in simple terms. Avoid technical jargon.

## 👥 Who It's For
Describe the target audience and use cases.

## ✨ Key Features
List 3-5 main features or capabilities as bullet points.

## 🛠️ Technology Stack
List the main technologies used, with brief explanations for non-developers.

## 🚀 Getting Started
Provide simple steps to get started with this project.

{{#if hasReleases}}
## 📥 Download & Install
Provide download information and installation instructions.
{{/if}}

## 📈 Project Status
Describe the project's maturity level (active, maintained, experimental, archived).

Use friendly language throughout. When technical terms are necessary, briefly explain them in parentheses.`;

// Suggested questions based on repository type
export const SUGGESTED_QUESTIONS = {
    default: [
        'What does this project do?',
        'How do I get started with this?',
        'What are the system requirements?',
        'Is this project actively maintained?',
    ],
    hasReleases: [
        'How do I download this?',
        'What platforms are supported?',
        "What's new in the latest version?",
        'How do I install this on Windows?',
    ],
    library: [
        'How do I install this library?',
        'Show me example usage',
        'What are the main functions?',
        'Is there documentation available?',
    ],
};
