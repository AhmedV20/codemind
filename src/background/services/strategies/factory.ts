import { AnalysisStrategy } from './types';
import { ClientSideStrategy } from './client-strategy';
import { AnalysisStrategyType, AnalysisStrategyConfig } from '@shared/types';

/**
 * Factory for creating analysis strategy instances
 * Extensible for future backend/hybrid strategies
 */
export class StrategyFactory {
    /**
     * Create strategy instance based on config
     */
    create(config: AnalysisStrategyConfig): AnalysisStrategy {
        switch (config.type) {
            case AnalysisStrategyType.CLIENT_SIDE:
                return new ClientSideStrategy();

            case AnalysisStrategyType.BACKEND:
                throw new Error('Backend strategy not yet implemented. Use CLIENT_SIDE for now.');

            case AnalysisStrategyType.HYBRID:
                throw new Error('Hybrid strategy not yet implemented. Use CLIENT_SIDE for now.');

            default:
                console.warn(`Unknown strategy type: ${config.type}, falling back to CLIENT_SIDE`);
                return new ClientSideStrategy();
        }
    }

    /**
     * Get recommended strategy for a repository
     */
    getRecommendedStrategy(repoInfo: { stars: number; fileCount?: number }): AnalysisStrategyType {
        // For now, always recommend client-side
        // Future: Could recommend backend for very large repos
        return AnalysisStrategyType.CLIENT_SIDE;
    }
}

// Singleton
export const strategyFactory = new StrategyFactory();
