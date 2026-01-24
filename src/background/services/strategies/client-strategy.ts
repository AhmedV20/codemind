import { RepositoryInfo, StrategyResult, AnalysisStrategyConfig, KeyFile } from '@shared/types';
import { AnalysisStrategy, TreeFetchResult } from './types';
import { githubClient } from '../../api/github';
import { prioritizeFiles } from './file-prioritizer';

/**
 * Client-side analysis strategy
 * Uses DOM scraping + GitHub API + raw.githubusercontent.com
 */
export class ClientSideStrategy implements AnalysisStrategy {
    readonly name = 'ClientSideStrategy';

    async canHandle(info: RepositoryInfo): Promise<boolean> {
        // Client strategy can always handle any public repo
        return true;
    }

    async execute(
        info: RepositoryInfo,
        config: AnalysisStrategyConfig
    ): Promise<StrategyResult> {
        console.log(`[${this.name}] Starting analysis for ${info.owner}/${info.repo}`);

        // Step 1: Get file tree
        const treeResult = await this.fetchFileTree(info);

        // Step 2: Prioritize files
        const scoredFiles = prioritizeFiles(treeResult.files, config);

        // Step 3: Select files within budget
        const selectedFiles = this.selectFilesWithinBudget(
            scoredFiles,
            config.tokenBudget,
            config.maxFiles
        );

        // Step 4: Fetch file contents
        const keyFiles = await this.fetchFileContents(
            info.owner,
            info.repo,
            info.branch,
            selectedFiles
        );

        // Step 5: Build structure
        const structure = {
            tree: treeResult.files.map(f => ({
                path: f.path,
                type: f.type === 'file' ? 'blob' as const : 'tree' as const,
                size: f.size,
            })),
            truncated: treeResult.truncated,
        };

        // Step 6: Estimate tokens
        const tokenEstimate = this.estimateTokens(keyFiles, structure);

        return {
            files: keyFiles,
            structure,
            tokenEstimate,
            coverage: this.determineCoverage(selectedFiles.length, treeResult.files.length),
            filesAnalyzed: keyFiles.length,
            totalFiles: treeResult.files.length,
        };
    }

    /**
     * Fetch file tree using best available method
     */
    private async fetchFileTree(info: RepositoryInfo): Promise<TreeFetchResult> {
        // Try GitHub API first (works without auth for public repos!)
        try {
            const apiFiles = await githubClient.fetchFullTree(
                info.owner,
                info.repo,
                info.branch
            );

            if (apiFiles && apiFiles.length > 0) {
                return {
                    files: apiFiles.map(f => ({
                        path: f.path,
                        type: f.type === 'blob' ? 'file' as const : 'directory' as const,
                        size: f.size,
                    })),
                    source: 'api',
                    truncated: false,
                };
            }
        } catch (error) {
            console.warn(`[${this.name}] GitHub API failed, falling back to discovery:`, error);
        }

        // Fallback: Use existing discovery method
        const discoveredFiles = await githubClient.discoverKeyFiles(info.owner, info.repo, info.branch);
        return {
            files: discoveredFiles.map(f => ({
                path: f.path,
                type: 'file' as const,
                size: f.content.length,
            })),
            source: 'mixed',
            truncated: true,
        };
    }

    /**
     * Select files within token budget
     */
    private selectFilesWithinBudget(
        scoredFiles: Array<{ path: string; size: number; score: number; category: string }>,
        tokenBudget: number,
        maxFiles: number
    ): Array<{ path: string; size: number; score: number; category: string }> {
        const selected: typeof scoredFiles = [];
        let estimatedTokens = 0;

        for (const file of scoredFiles) {
            if (selected.length >= maxFiles) break;

            const fileTokens = Math.ceil(file.size / 4); // 4 chars per token estimate

            if (estimatedTokens + fileTokens <= tokenBudget) {
                selected.push(file);
                estimatedTokens += fileTokens;
            }
        }

        console.log(`[${this.name}] Selected ${selected.length} files (~${estimatedTokens} tokens)`);
        return selected;
    }

    /**
     * Fetch contents of selected files
     */
    private async fetchFileContents(
        owner: string,
        repo: string,
        branch: string,
        files: Array<{ path: string; category: string }>
    ): Promise<KeyFile[]> {
        const contents = await Promise.all(
            files.map(async (file) => {
                try {
                    const content = await githubClient.fetchFileContent(owner, repo, branch, file.path);
                    if (content) {
                        return {
                            path: file.path,
                            content: this.truncateContent(content, 5000),
                            type: file.category as KeyFile['type'],
                        } as KeyFile;
                    }
                } catch (error) {
                    console.warn(`[${this.name}] Failed to fetch ${file.path}:`, error);
                }
                return null;
            })
        );

        return contents.filter((c): c is KeyFile => c !== null);
    }

    /**
     * Truncate file content if too long
     */
    private truncateContent(content: string, maxLength: number): string {
        if (content.length <= maxLength) return content;

        const lines = content.split('\n');
        const headLines = Math.floor(maxLength * 0.7 / (content.length / lines.length));
        const tailLines = Math.floor(maxLength * 0.2 / (content.length / lines.length));

        const head = lines.slice(0, headLines).join('\n');
        const tail = lines.slice(-tailLines).join('\n');

        return `${head}\n\n... [${lines.length - headLines - tailLines} lines truncated] ...\n\n${tail}`;
    }

    /**
     * Estimate total tokens
     */
    private estimateTokens(files: KeyFile[], structure: any): number {
        const contentTokens = files.reduce((sum, f) => sum + Math.ceil(f.content.length / 4), 0);
        const structureTokens = 500;
        const metadataTokens = 200;

        return contentTokens + structureTokens + metadataTokens;
    }

    /**
     * Determine coverage level
     */
    private determineCoverage(analyzed: number, total: number): 'full' | 'partial' | 'minimal' {
        const ratio = analyzed / total;
        if (ratio >= 0.8) return 'full';
        if (ratio >= 0.4) return 'partial';
        return 'minimal';
    }
}
