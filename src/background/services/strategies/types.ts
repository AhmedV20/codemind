import {
    RepositoryInfo,
    RepositoryData,
    StrategyResult,
    AnalysisStrategyConfig
} from '@shared/types';

/**
 * Base interface for all analysis strategies
 * Allows easy extension for backend/hybrid modes
 */
export interface AnalysisStrategy {
    /**
     * Strategy name for logging/debugging
     */
    readonly name: string;

    /**
     * Fetch and prepare repository data for analysis
     */
    execute(
        info: RepositoryInfo,
        config: AnalysisStrategyConfig
    ): Promise<StrategyResult>;

    /**
     * Check if this strategy can handle the given repository
     */
    canHandle(info: RepositoryInfo): Promise<boolean>;
}

/**
 * Options for file tree fetching
 */
export interface TreeFetchOptions {
    useAPI: boolean;        // Use GitHub API or fallback to scraping
    maxDepth?: number;      // Max directory depth to explore
    timeout?: number;       // Timeout in ms
}

/**
 * Result from file tree fetching
 */
export interface TreeFetchResult {
    files: Array<{
        path: string;
        type: 'file' | 'directory';
        size?: number;
    }>;
    source: 'api' | 'dom_scraping' | 'mixed';
    truncated: boolean;
}
