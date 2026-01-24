import { RepositoryInfo, Analysis, ChatMessage, ConversationMemory } from '@shared/types';
import { githubClient } from '../api/github';
import { createProvider } from '../api/provider-factory';
import { cacheManager } from './cache';
import { settingsManager } from './settings';
import { strategyFactory } from './strategies/factory';
import { promptOptimizer } from './strategies/prompt-optimizer';

/**
 * Analysis orchestration service
 * Coordinates GitHub data fetching, AI analysis, and caching
 */
export class AnalysisService {
    /**
     * Analyze a repository using strategy pattern
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

        // Force refresh settings to ensure we have the latest token
        const settings = await settingsManager.forceRefresh();

        // Set GitHub token if available
        const hasGitHubToken = !!(settings.github?.token);
        console.log('[AnalysisService] GitHub token available:', hasGitHubToken);
        if (settings.github?.token) {
            githubClient.setToken(settings.github.token);
        }

        // Create analysis strategy
        const strategy = strategyFactory.create(settings.analysis.strategyConfig);
        console.log('[AnalysisService] Using strategy:', strategy.name);

        // Execute strategy to get repository data
        const strategyResult = await strategy.execute(repoInfo, settings.analysis.strategyConfig);

        // Build repository data object (for metadata)
        const metadata = repoInfo.scrapedMetadata
            ? githubClient['convertScrapedToMetadata'](repoInfo, repoInfo.scrapedMetadata)
            : await githubClient.fetchMetadata(owner, repo);

        const readme = await githubClient.fetchReadme(owner, repo, branch);

        const repoData = {
            info: repoInfo,
            metadata,
            readme,
            structure: strategyResult.structure,
            releases: [], // Skip releases to avoid rate limits
            keyFiles: strategyResult.files,
        };

        // Build optimized prompt
        const optimizedPrompt = promptOptimizer.buildPrompt(repoData, strategyResult);

        // Create AI provider and run analysis
        const provider = createProvider(settings);
        console.log('[AnalysisService] Running AI analysis with', provider.name);

        const analysis = await provider.analyzeRepository(
            { ...repoData, readme: optimizedPrompt },  // Replace README with optimized prompt
            onChunk
        );

        // Store enhanced data in cache for chat
        const enhancedAnalysis: Analysis = {
            ...analysis,
            strategyResult,
            metadata,
            optimizedPrompt,
        };

        // Cache the result with enhanced data
        await cacheManager.set(owner, repo, branch, enhancedAnalysis, settings.analysis.cacheDuration);

        return enhancedAnalysis;
    }

    /**
     * Handle a chat message using cached analysis data
     */
    async handleChatMessage(
        repoInfo: RepositoryInfo,
        question: string,
        history: ChatMessage[],
        onChunk: (chunk: string) => void
    ): Promise<ChatMessage> {
        const settings = await settingsManager.get();
        const provider = createProvider(settings);

        // Get cached analysis (should exist if chat is available)
        const cached = await cacheManager.get(repoInfo.owner, repoInfo.repo, repoInfo.branch);
        if (!cached) {
            throw new Error('No analysis found. Please analyze the repository first.');
        }

        // Build context from CACHED data (not re-fetching files!)
        const repoData = {
            info: repoInfo,
            metadata: cached.metadata || await githubClient.fetchMetadata(repoInfo.owner, repoInfo.repo),
            readme: '',
            structure: cached.strategyResult?.structure || { tree: [], truncated: false },
            releases: [],
            keyFiles: cached.strategyResult?.files || [],
        };

        // Initialize conversation memory if not exists
        const conversationMemory: ConversationMemory = {
            sessionId: Date.now().toString(),
            facts: [],
            topics: [],
            questionsAsked: [],
            lastUpdated: Date.now(),
        };

        const context = {
            repoData,
            analysis: cached,
            history: history.map(m => ({ role: m.role, content: m.content })),
            conversationMemory,
            optimizedPrompt: cached.optimizedPrompt,
        };

        // Get chat response
        console.log('[AnalysisService] Sending chat message to', provider.name);
        const response = await provider.chat(question, context, onChunk);

        // Extract simple facts from conversation
        const newFacts = this.extractFacts(question, response);
        const topics = this.extractTopics(question);

        // Update conversation memory
        await cacheManager.updateConversationMemory(
            repoInfo.owner,
            repoInfo.repo,
            repoInfo.branch,
            {
                ...conversationMemory,
                facts: newFacts,
                questionsAsked: [...conversationMemory.questionsAsked, question],
                topics,
            }
        );

        return {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
        };
    }

    /**
     * Extract facts from conversation
     */
    private extractFacts(question: string, response: string): Array<{ fact: string; confidence: number; addedAt: number }> {
        const facts: Array<{ fact: string; confidence: number; addedAt: number }> = [];

        // Simple fact extraction - just store the Q&A
        if (response.length > 0) {
            facts.push({
                fact: `Q: ${question.slice(0, 100)} | A: ${response.slice(0, 200)}`,
                confidence: 0.8,
                addedAt: Date.now(),
            });
        }

        return facts;
    }

    /**
     * Extract topics from question
     */
    private extractTopics(question: string): string[] {
        const topics: string[] = [];
        const keywords = ['install', 'setup', 'deploy', 'test', 'build', 'run', 'config', 'api', 'database', 'how'];

        keywords.forEach(keyword => {
            if (question.toLowerCase().includes(keyword)) {
                topics.push(keyword);
            }
        });

        return topics;
    }
}

// Singleton instance
export const analysisService = new AnalysisService();
