import { RepositoryData, StrategyResult } from '@shared/types';
import { TOKEN_ESTIMATION } from '@shared/constants';

interface PromptBudget {
    metadata: number;
    structure: number;
    readme: number;
    keyFiles: number;
    total: number;
}

/**
 * Optimizes prompts for AI models by intelligently allocating token budget
 */
export class PromptOptimizer {
    /**
     * Build optimized prompt from strategy result
     */
    buildPrompt(repoData: RepositoryData, strategyResult: StrategyResult): string {
        const budget = this.calculateBudget(strategyResult.tokenEstimate);

        const sections: string[] = [
            this.buildMetadataSection(repoData.metadata, budget.metadata),
            this.buildStructureSection(strategyResult.structure, budget.structure),
            this.buildReadmeSection(repoData.readme, budget.readme),
            this.buildKeyFilesSection(strategyResult.files, budget.keyFiles),
            this.buildCoverageSection(strategyResult),
        ];

        return sections.join('\n\n');
    }

    /**
     * Calculate token budget allocation for each section
     */
    private calculateBudget(totalEstimate: number): PromptBudget {
        return {
            metadata: TOKEN_ESTIMATION.METADATA_TOKENS,
            structure: TOKEN_ESTIMATION.STRUCTURE_TOKENS,
            readme: Math.min(Math.floor(totalEstimate * 0.3), 6000),
            keyFiles: Math.min(Math.floor(totalEstimate * 0.6), 15000),
            total: totalEstimate,
        };
    }

    /**
     * Build repository metadata section
     */
    private buildMetadataSection(metadata: any, tokenBudget: number): string {
        return `## 📁 REPOSITORY METADATA

| Field | Value |
|:------|:------|
| **Repository** | ${metadata.fullName} |
| **Description** | ${metadata.description || 'No description provided'} |
| **Primary Language** | ${metadata.language || 'Not specified'} |
| **Stars** | ⭐ ${metadata.stars.toLocaleString()} |
| **Forks** | 🔀 ${metadata.forks.toLocaleString()} |
| **License** | ${metadata.license || 'Not specified'} |
| **Topics** | ${metadata.topics.length > 0 ? metadata.topics.join(', ') : 'None'} |
| **Archived** | ${metadata.isArchived ? '⚠️ Yes' : '✅ No'} |
| **Fork** | ${metadata.isFork ? 'Yes' : 'No'} |`;
    }

    /**
     * Build file structure section
     */
    private buildStructureSection(structure: any, tokenBudget: number): string {
        const grouped = this.groupFilesByDirectory(structure.tree);
        const maxDirs = 15;
        const maxFilesPerDir = 8;

        let output = '## 📂 PROJECT STRUCTURE\n\n```\n';

        let dirCount = 0;
        for (const [dir, files] of grouped) {
            if (dirCount >= maxDirs) {
                output += `... +${grouped.size - maxDirs} more directories\n`;
                break;
            }

            output += `📁 ${dir}/\n`;
            files.slice(0, maxFilesPerDir).forEach(f => {
                const fileName = f.split('/').pop();
                output += `   └─ ${fileName}\n`;
            });

            if (files.length > maxFilesPerDir) {
                output += `   ... +${files.length - maxFilesPerDir} more files\n`;
            }

            dirCount++;
        }

        output += '```';

        if (structure.truncated) {
            output += '\n\n> **Note:** Structure is truncated. Some files may not be shown.';
        }

        return output;
    }

    /**
     * Build README section
     */
    private buildReadmeSection(readme: string | null, tokenBudget: number): string {
        if (!readme) {
            return '## 📖 README\n\n*No README found*';
        }

        const truncated = this.truncateToTokens(readme, tokenBudget);
        const wasTruncated = truncated.length < readme.length;

        let output = '## 📖 README\n\n';
        output += truncated;

        if (wasTruncated) {
            output += '\n\n*... [README truncated for brevity]*';
        }

        return output;
    }

    /**
     * Build key files section
     */
    private buildKeyFilesSection(files: any[], tokenBudget: number): string {
        if (files.length === 0) {
            return '## 📄 KEY FILES\n\n*No key files available*';
        }

        let output = '## 📄 KEY FILES\n\n';
        let tokensUsed = 0;
        const maxTokensPerFile = Math.floor(tokenBudget / files.length);

        for (const file of files) {
            if (tokensUsed >= tokenBudget) {
                output += `\n*... ${files.length - files.indexOf(file)} more files not shown due to token limit*`;
                break;
            }

            const icon = this.getFileIcon(file.type);
            const content = this.truncateToTokens(file.content, maxTokensPerFile);

            output += `### ${icon} ${file.path}\n\n`;
            output += `\`\`\`${this.getFileLanguage(file.path)}\n${content}\n\`\`\`\n\n`;

            tokensUsed += Math.ceil(content.length / TOKEN_ESTIMATION.CHARS_PER_TOKEN);
        }

        return output;
    }

    /**
     * Build coverage info section
     */
    private buildCoverageSection(result: StrategyResult): string {
        const percentage = Math.round((result.filesAnalyzed / result.totalFiles) * 100);
        const coverageEmoji = result.coverage === 'full' ? '✅' : result.coverage === 'partial' ? '⚠️' : '❌';

        return `## 📊 ANALYSIS COVERAGE

${coverageEmoji} **Coverage:** ${result.coverage} (${percentage}% of repository)
- **Files Analyzed:** ${result.filesAnalyzed} / ${result.totalFiles}
- **Estimated Tokens:** ~${result.tokenEstimate.toLocaleString()}`;
    }

    /**
     * Group files by top-level directory
     */
    private groupFilesByDirectory(tree: any[]): Map<string, string[]> {
        const grouped = new Map<string, string[]>();

        tree.forEach(item => {
            const parts = item.path.split('/');
            const topLevel = parts.length > 1 ? parts[0] : '(root)';

            if (!grouped.has(topLevel)) {
                grouped.set(topLevel, []);
            }

            grouped.get(topLevel)!.push(item.path);
        });

        return new Map([...grouped.entries()].sort((a, b) => b[1].length - a[1].length));
    }

    /**
     * Truncate text to fit within token budget
     */
    private truncateToTokens(text: string, maxTokens: number): string {
        const maxChars = maxTokens * TOKEN_ESTIMATION.CHARS_PER_TOKEN;

        if (text.length <= maxChars) return text;

        const truncated = text.substring(0, maxChars);
        const lastNewline = truncated.lastIndexOf('\n');

        if (lastNewline > maxChars * 0.8) {
            return truncated.substring(0, lastNewline);
        }

        return truncated;
    }

    private getFileIcon(type: string): string {
        const icons: Record<string, string> = {
            docs: '📖',
            config: '⚙️',
            source: '📄',
            test: '🧪',
            other: '📋',
        };
        return icons[type] || '📋';
    }

    private getFileLanguage(path: string): string {
        const ext = path.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
            ts: 'typescript', tsx: 'typescript',
            js: 'javascript', jsx: 'javascript',
            py: 'python', rs: 'rust', go: 'go',
            json: 'json', md: 'markdown',
            yaml: 'yaml', yml: 'yaml',
        };
        return langMap[ext || ''] || '';
    }
}

export const promptOptimizer = new PromptOptimizer();
