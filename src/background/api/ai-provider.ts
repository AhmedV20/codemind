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

    return `You are CodeMind, an expert AI assistant that analyzes GitHub repositories and explains them to users of ALL skill levels. Your goal is to provide a comprehensive yet accessible analysis.

## REPOSITORY DATA

### Basic Information
| Property | Value |
|----------|-------|
| **Name** | ${metadata.fullName} |
| **Description** | ${metadata.description || 'No description provided'} |
| **Primary Language** | ${metadata.language || 'Not specified'} |
| **Stars** | ⭐ ${metadata.stars.toLocaleString()} |
| **Forks** | 🔀 ${metadata.forks.toLocaleString()} |
| **License** | ${metadata.license || 'Not specified'} |
| **Topics** | ${metadata.topics.length > 0 ? metadata.topics.join(', ') : 'None'} |
| **Created** | ${new Date(metadata.createdAt).toLocaleDateString()} (${projectAge} months ago) |
| **Last Update** | ${new Date(metadata.pushedAt).toLocaleDateString()} (${lastActivity} days ago) |
| **Archived** | ${metadata.isArchived ? '⚠️ Yes' : 'No'} |
| **Fork** | ${metadata.isFork ? 'Yes' : 'No'} |
${dependenciesSummary}

### README Content
${readme ? readme.slice(0, 10000) : 'No README available'}

### Project Structure
\`\`\`
${structureSummary}
${structure.truncated ? '\n... (repository has more files)' : ''}
\`\`\`

### Key Source Files
${keyFilesSection}

### Releases
**Latest:** ${latestRelease}
${releases.length > 0 ? `**Total Releases:** ${releases.length}${releases.length >= 5 ? '+' : ''}\n**Assets:** ${releases[0].assets.map(a => a.name).join(', ') || 'None'}` : ''}

---

## YOUR TASK

Analyze this repository and produce a **well-structured, comprehensive summary**. Follow this exact format:

## 🎯 Quick Overview
> A compelling 2-3 sentence summary that captures what this project is and why someone should care. Make it engaging!

## 💡 What This Project Does
Explain the core purpose and main functionality. Use simple language that anyone can understand. If there are technical terms, explain them briefly.

**Key Capabilities:**
- Capability 1
- Capability 2
- Capability 3

## 👤 Who Should Use This
Describe the ideal users and use cases:
- **Developers:** [How developers would use this]
- **End Users:** [How regular users would benefit]
- **Teams/Organizations:** [Enterprise or team use cases, if applicable]

## 🛠️ Tech Stack & Architecture

| Technology | Purpose |
|------------|---------|
| [Tech 1] | [What it's used for] |
| [Tech 2] | [What it's used for] |

**Architecture Overview:** [Brief description of how the project is structured]

## ✨ Standout Features
1. **[Feature Name]** - [Description]
2. **[Feature Name]** - [Description]
3. **[Feature Name]** - [Description]

## 🚀 Getting Started

### Prerequisites
- [Requirement 1]
- [Requirement 2]

### Quick Start
\`\`\`bash
# Installation commands based on the actual project
\`\`\`

### Basic Usage
[Simple example of how to use this]

${releases.length > 0 ? `## 📥 Downloads & Installation
**Latest Version:** ${releases[0].tagName}

[Provide download links and installation options based on available releases]` : ''}

## 📊 Project Health
| Metric | Status |
|--------|--------|
| **Activity** | ${lastActivity <= 7 ? '🟢 Very Active' : lastActivity <= 30 ? '🟡 Active' : lastActivity <= 90 ? '🟠 Moderate' : '🔴 Inactive'} (${lastActivity} days since last update) |
| **Maturity** | ${releases.length >= 5 ? '🟢 Mature' : releases.length >= 1 ? '🟡 Growing' : '🟠 Early Stage'} |
| **Community** | ${metadata.stars >= 1000 ? '🟢 Strong' : metadata.stars >= 100 ? '🟡 Growing' : '🟠 Building'} (${metadata.stars.toLocaleString()} stars) |
| **Maintenance** | ${metadata.isArchived ? '🔴 Archived' : lastActivity <= 30 ? '🟢 Well Maintained' : '🟡 Maintained'} |

## 💬 Summary
[A final paragraph summarizing the project's value proposition and whether you'd recommend it]

---

**IMPORTANT GUIDELINES:**
1. Be accurate - only include information that can be verified from the provided data
2. Be helpful - explain technical concepts in accessible terms
3. Be honest - if the project has limitations or the data is incomplete, mention it
4. Use the exact markdown formatting shown above
5. Include code blocks where relevant
6. Fill in ALL sections, even if brief
7. Numbers should be formatted nicely (e.g., 1,234 not 1234)`;
}

/**
 * Build a chat prompt for follow-up questions
 */
export function buildChatPrompt(question: string, context: ChatContext): string {
    const { repoData, analysis, history } = context;

    // Build conversation history
    const historyText = history
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `**${msg.role === 'user' ? 'User' : 'CodeMind'}:** ${msg.content}`)
        .join('\n\n');

    // Include key files in context for better answers
    const keyFilesContext = repoData.keyFiles.length > 0
        ? `\n\nKey files available for reference:\n${repoData.keyFiles.map(f => `- ${f.path}`).join('\n')}`
        : '';

    return `You are CodeMind, an AI assistant helping users understand the GitHub repository "${repoData.metadata.fullName}".

## Repository Summary
${analysis.content.slice(0, 5000)}
${keyFilesContext}

${history.length > 0 ? `## Previous Conversation\n${historyText}\n` : ''}

## Current Question
**User asks:** "${question}"

## Instructions
1. Answer based on the repository data and your previous analysis
2. Be specific and reference actual files/features when relevant
3. If you need to show code or commands, use proper markdown code blocks
4. If you're not sure about something, say so clearly
5. Keep your response focused and helpful
6. For technical questions, provide accurate details
7. For beginner questions, explain concepts simply

Provide your response:`;
}
