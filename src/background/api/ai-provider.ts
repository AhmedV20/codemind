import { RepositoryData, Analysis } from '@shared/types';

/**
 * Abstract interface for AI providers
 * All AI providers (Claude, Gemini, HuggingFace) must implement this interface
 */
export interface AIProvider {
    /**
     * Provider name for display purposes
     */
    readonly name: string;

    /**
     * Analyze a repository and generate a summary
     * @param repoData - Repository data to analyze
     * @param onChunk - Callback for streaming chunks
     * @returns Complete analysis
     */
    analyzeRepository(
        repoData: RepositoryData,
        onChunk: (chunk: string) => void
    ): Promise<Analysis>;

    /**
     * Handle a chat message in the context of a repository
     * @param question - User's question
     * @param context - Conversation context including repo data and history
     * @param onChunk - Callback for streaming chunks
     * @returns AI response
     */
    chat(
        question: string,
        context: ChatContext,
        onChunk: (chunk: string) => void
    ): Promise<string>;

    /**
     * Test if the provider is configured and working
     * @returns true if the provider is ready
     */
    testConnection(): Promise<boolean>;
}

export interface ChatContext {
    repoData: RepositoryData;
    analysis: Analysis;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    conversationMemory?: import('@shared/types').ConversationMemory;
    optimizedPrompt?: string;
}

/**
 * Build the analysis prompt for any AI provider
 */
export function buildAnalysisPrompt(repoData: RepositoryData): string {
    const { metadata, readme, structure, releases, keyFiles } = repoData;

    // Categorize files by directory
    const filesByDir = new Map<string, string[]>();
    structure.tree.forEach(item => {
        const parts = item.path.split('/');
        const dir = parts.length > 1 ? parts[0] : '(root)';
        if (!filesByDir.has(dir)) {
            filesByDir.set(dir, []);
        }
        if (parts.length <= 2) { // Only show 2 levels deep
            filesByDir.get(dir)!.push(item.path);
        }
    });

    // Build structure summary
    const structureSummary = Array.from(filesByDir.entries())
        .slice(0, 15)
        .map(([dir, files]) => {
            const displayFiles = files.slice(0, 5);
            return `📁 ${dir}/\n  ${displayFiles.map(f => `└─ ${f.split('/').pop()}`).join('\n  ')}${files.length > 5 ? `\n  ... +${files.length - 5} more` : ''}`;
        })
        .join('\n');

    // Build key files section
    const keyFilesSection = keyFiles.length > 0
        ? keyFiles.map(file => {
            const icon = file.type === 'config' ? '⚙️' : file.type === 'source' ? '📄' : '📖';
            return `### ${icon} ${file.path}\n\`\`\`\n${file.content}\n\`\`\``;
        }).join('\n\n')
        : 'No key files available';

    // Get dependencies summary from package.json if available
    const packageJson = keyFiles.find(f => f.path === 'package.json');
    let dependenciesSummary = '';
    if (packageJson) {
        try {
            const pkg = JSON.parse(packageJson.content.replace('... [truncated]', '}'));
            const deps = Object.keys(pkg.dependencies || {}).slice(0, 10);
            const devDeps = Object.keys(pkg.devDependencies || {}).slice(0, 10);
            if (deps.length > 0) {
                dependenciesSummary = `\n**Dependencies:** ${deps.join(', ')}`;
            }
            if (devDeps.length > 0) {
                dependenciesSummary += `\n**Dev Dependencies:** ${devDeps.join(', ')}`;
            }
        } catch {
            // Ignore parse errors
        }
    }

    const latestRelease = releases.length > 0
        ? `${releases[0].name} (${releases[0].tagName}) - ${new Date(releases[0].publishedAt).toLocaleDateString()}`
        : 'No releases yet';

    const projectAge = Math.floor((Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
    const lastActivity = Math.floor((Date.now() - new Date(metadata.pushedAt).getTime()) / (1000 * 60 * 60 * 24));

    return `You are **CodeMind**, an expert AI assistant that provides comprehensive, professional-grade analysis of GitHub repositories. Your analysis should be suitable for export as a professional report (PDF or Markdown).

---

## 📁 REPOSITORY DATA

### Repository Metadata
| Field | Value |
|:------|:------|
| **Repository** | ${metadata.fullName} |
| **Description** | ${metadata.description || 'No description provided'} |
| **Primary Language** | ${metadata.language || 'Not specified'} |
| **Stars** | ⭐ ${metadata.stars.toLocaleString()} |
| **Forks** | 🔀 ${metadata.forks.toLocaleString()} |
| **License** | ${metadata.license || 'Not specified'} |
| **Topics** | ${metadata.topics.length > 0 ? metadata.topics.join(', ') : 'None'} |
| **Created** | ${new Date(metadata.createdAt).toLocaleDateString()} (${projectAge} months ago) |
| **Last Updated** | ${new Date(metadata.pushedAt).toLocaleDateString()} (${lastActivity} days ago) |
| **Status** | ${metadata.isArchived ? '⚠️ Archived' : '✅ Active'} |
| **Type** | ${metadata.isFork ? 'Fork' : 'Original'} |
${dependenciesSummary}

### README Content
${readme ? readme.slice(0, 12000) : 'No README available'}

### Project Structure
\`\`\`
${structureSummary}
${structure.truncated ? '\n... (repository contains additional files)' : ''}
\`\`\`

### Key Source Files
${keyFilesSection}

### Release Information
- **Latest Release:** ${latestRelease}
${releases.length > 0 ? `- **Total Releases:** ${releases.length}${releases.length >= 5 ? '+' : ''}\n- **Available Assets:** ${releases[0].assets.map(a => a.name).join(', ') || 'None'}` : ''}

---

## 🎯 YOUR TASK

Generate a **comprehensive, professional repository analysis report** using the exact markdown structure below. This report should be suitable for sharing with team members, executives, or stakeholders.

**IMPORTANT FORMATTING RULES:**
1. Use proper markdown syntax throughout
2. Use tables for structured data
3. Use code blocks with language hints for any code
4. Use blockquotes (>) for important callouts
5. Use bullet points and numbered lists appropriately
6. Keep sections concise but informative
7. Numbers should be formatted (e.g., 1,234 not 1234)

---

## 📋 Executive Summary

> **[Repository Name]** is [one compelling sentence about what it is and its primary value proposition]. [One sentence about its current status/maturity].

| Quick Stats | |
|:------------|:--|
| **Type** | [Application/Library/Framework/Tool/etc.] |
| **Maturity** | [Production Ready/Beta/Alpha/Experimental] |
| **Activity** | ${lastActivity <= 7 ? '🟢 Very Active' : lastActivity <= 30 ? '🟡 Active' : lastActivity <= 90 ? '🟠 Moderate' : '🔴 Inactive'} |
| **Community** | ${metadata.stars >= 1000 ? '🟢 Large' : metadata.stars >= 100 ? '🟡 Growing' : '🟠 Small'} (${metadata.stars.toLocaleString()} stars) |

---

## 💡 What This Project Does

[2-3 paragraphs explaining the core functionality in clear, accessible language. Avoid jargon where possible, and when technical terms are necessary, provide brief explanations.]

### Core Capabilities

- **[Capability 1]:** [Clear description]
- **[Capability 2]:** [Clear description]
- **[Capability 3]:** [Clear description]
- **[Capability 4]:** [Clear description if applicable]

---

## 👥 Target Audience

| User Type | Use Case |
|:----------|:---------|
| **Developers** | [How developers would use this] |
| **End Users** | [How end users benefit, if applicable] |
| **Teams/Organizations** | [Enterprise or team use cases] |

---

## 🛠️ Technology Stack

| Technology | Category | Purpose |
|:-----------|:---------|:--------|
| [Technology 1] | [Language/Framework/Tool/etc.] | [What it's used for] |
| [Technology 2] | [Language/Framework/Tool/etc.] | [What it's used for] |
| [Technology 3] | [Language/Framework/Tool/etc.] | [What it's used for] |

### Architecture Overview

[Brief description of how the project is structured - e.g., monorepo, microservices, MVC pattern, etc.]

---

## ✨ Key Features

1. **[Feature Name]**
   [Detailed description of the feature and its benefits]

2. **[Feature Name]**
   [Detailed description of the feature and its benefits]

3. **[Feature Name]**
   [Detailed description of the feature and its benefits]

4. **[Feature Name]** *(if applicable)*
   [Detailed description of the feature and its benefits]

---

## 🚀 Getting Started

### Prerequisites

- [Requirement 1 with version if applicable]
- [Requirement 2]
- [Requirement 3]

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/${metadata.fullName}.git

# Navigate to the project
cd ${metadata.name}

# [Additional installation commands based on the project type]
\`\`\`

### Quick Start

\`\`\`bash
# [Commands to get started - based on actual project]
\`\`\`

${releases.length > 0 ? `---

## 📥 Downloads & Installation

| Version | Release Date | Type |
|:--------|:-------------|:-----|
| **${releases[0].tagName}** | ${new Date(releases[0].publishedAt).toLocaleDateString()} | ${releases[0].isPrerelease ? '⚠️ Pre-release' : '✅ Stable'} |

### Available Downloads

${releases[0].assets.length > 0 ? releases[0].assets.map(a => `- **${a.name}** (${(a.size / 1024 / 1024).toFixed(2)} MB)`).join('\n') : 'No downloadable assets available. Install from source.'}
` : ''}

---

## 📊 Project Health Dashboard

| Metric | Status | Details |
|:-------|:-------|:--------|
| **Activity Level** | ${lastActivity <= 7 ? '🟢 Very Active' : lastActivity <= 30 ? '🟡 Active' : lastActivity <= 90 ? '🟠 Moderate' : '🔴 Inactive'} | Last updated ${lastActivity} days ago |
| **Maturity** | ${releases.length >= 5 ? '🟢 Mature' : releases.length >= 1 ? '🟡 Growing' : '🟠 Early Stage'} | ${releases.length} release(s) |
| **Community** | ${metadata.stars >= 1000 ? '🟢 Strong' : metadata.stars >= 100 ? '🟡 Growing' : '🟠 Building'} | ${metadata.stars.toLocaleString()} stars, ${metadata.forks.toLocaleString()} forks |
| **Maintenance** | ${metadata.isArchived ? '🔴 Archived' : lastActivity <= 30 ? '🟢 Well Maintained' : '🟡 Maintained'} | ${metadata.isArchived ? 'No longer maintained' : 'Receiving updates'} |

---

## 🔒 Security & Stability

- **License:** ${metadata.license || 'Not specified'} ${metadata.license ? '✅' : '⚠️'}
- **Archived:** ${metadata.isArchived ? '⚠️ Yes - No longer maintained' : '✅ No - Actively maintained'}
- **Fork Status:** ${metadata.isFork ? 'This is a fork of another project' : 'Original project'}

---

## 💬 Conclusion & Recommendations

### Summary

[A concise paragraph summarizing the project's value proposition, strengths, and potential limitations based on the analysis.]

### Recommendation

| Consideration | Assessment |
|:--------------|:-----------|
| **Should you use this?** | [Yes/No/It depends - with brief reasoning] |
| **Best for** | [Primary use cases] |
| **Consider alternatives if** | [Scenarios where this might not be the best choice] |

`;
}

/**
 * Build a chat prompt for follow-up questions
 */
export function buildChatPrompt(question: string, context: ChatContext): string {
    const { repoData, analysis, history, conversationMemory, optimizedPrompt } = context;

    // Build conversation history
    const historyText = history
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `**${msg.role === 'user' ? 'User' : 'CodeMind'}:** ${msg.content}`)
        .join('\n\n');

    // Build memory context from previous conversations
    const memoryContext = conversationMemory && conversationMemory.facts.length > 0
        ? `\n\n## Previous Conversation Context\n${conversationMemory.facts.slice(-5).map(f => `- ${f.fact}`).join('\n')}`
        : '';

    // Use CACHED files (not trying to fetch missing ones) - show with ✅
    const keyFilesContext = repoData.keyFiles.length > 0
        ? `\n\n## Files Analyzed in Repository\n${repoData.keyFiles.map(f => `✅ ${f.path}`).join('\n')}`
        : '';

    return `You are CodeMind, an AI assistant helping users understand the GitHub repository "${repoData.metadata.fullName}".

## Repository Analysis Summary
${analysis.content.slice(0, 3000)}
${keyFilesContext}
${memoryContext}

${history.length > 0 ? `## Previous Conversation\n${historyText}\n` : ''}

## Current Question
**User asks:** "${question}"

## Instructions
1. Answer based on the analyzed files and previous analysis
2. Reference ONLY the files listed above (marked with ✅)
3. Use conversation memory to provide continuity
4. Be specific and accurate
5. If a file wasn't analyzed, say so clearly - don't make assumptions
6. Keep responses focused and helpful

Provide your response:`;
}
