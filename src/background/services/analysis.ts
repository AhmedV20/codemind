import { RepositoryInfo, Analysis, ChatMessage } from '@shared/types';
import { githubClient } from '../api/github';
import { createProvider } from '../api/provider-factory';
import { cacheManager } from './cache';
import { settingsManager } from './settings';

/**
 * Analysis orchestration service
 * Coordinates GitHub data fetching, AI analysis, and caching
 */
export class AnalysisService {
    /**
     * Analyze a repository
     */
    async analyzeRepository(
        repoInfo: RepositoryInfo,
        onChunk: (chunk: string) => void
    ): Promise<Analysis> {
        const { owner, repo, branch } = repoInfo;

        // Check cache first
        const cached = await cacheManager.get(owner, repo, branch);
        if (cached) {
            console.log('[AnalysisService] Returning cached analysis');
            return cached;
        }

        // Get settings
        const settings = await settingsManager.get();

        // Set GitHub token if available
        if (settings.github?.token) {
            githubClient.setToken(settings.github.token);
        }

        // Create AI provider
        const provider = createProvider(settings);

        // Fetch repository data from GitHub
        console.log('[AnalysisService] Fetching repository data...');
        const repoData = await githubClient.fetchRepositoryData(repoInfo);

        // Run AI analysis
        console.log('[AnalysisService] Running AI analysis with', provider.name);
        const analysis = await provider.analyzeRepository(repoData, onChunk);

        // Cache the result
        const cacheDuration = settings.analysis.cacheDuration;
        await cacheManager.set(owner, repo, branch, analysis, cacheDuration);

        return analysis;
    }

    /**
     * Handle a chat message
     */
    async handleChatMessage(
        repoInfo: RepositoryInfo,
        question: string,
        history: ChatMessage[],
        onChunk: (chunk: string) => void
    ): Promise<ChatMessage> {
        // Get settings
        const settings = await settingsManager.get();

        // Create AI provider
        const provider = createProvider(settings);

        // Get cached analysis (should exist if chat is available)
        const analysis = await cacheManager.get(repoInfo.owner, repoInfo.repo, repoInfo.branch);
        if (!analysis) {
            throw new Error('No analysis found. Please analyze the repository first.');
        }

        // Fetch repo data for context
        const repoData = await githubClient.fetchRepositoryData(repoInfo);

        // Build context
        const context = {
            repoData,
            analysis,
            history: history.map(m => ({ role: m.role, content: m.content })),
        };

        // Get chat response
        console.log('[AnalysisService] Sending chat message to', provider.name);
        const response = await provider.chat(question, context, onChunk);

        // Return as ChatMessage
        return {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
        };
    }
}

// Singleton instance
export const analysisService = new AnalysisService();
