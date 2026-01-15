import { AIProvider as AIProviderEnum, ExtensionSettings } from '@shared/types';
import { AIProvider } from './ai-provider';
import { ClaudeProvider } from './providers/claude';
import { GeminiProvider } from './providers/gemini';
import { HuggingFaceProvider } from './providers/huggingface';

/**
 * Factory for creating AI provider instances
 */
export function createProvider(settings: ExtensionSettings): AIProvider {
    const { selectedProvider, providers } = settings.ai;

    switch (selectedProvider) {
        case AIProviderEnum.CLAUDE: {
            const config = providers[AIProviderEnum.CLAUDE];
            if (!config.apiKey) {
                throw new Error('Claude API key not configured. Please add your API key in the extension settings.');
            }
            return new ClaudeProvider(config.apiKey, config.model);
        }

        case AIProviderEnum.GEMINI: {
            const config = providers[AIProviderEnum.GEMINI];
            if (!config.apiKey) {
                throw new Error('Gemini API key not configured. Please add your API key in the extension settings.');
            }
            return new GeminiProvider(config.apiKey, config.model);
        }

        case AIProviderEnum.HUGGINGFACE: {
            const config = providers[AIProviderEnum.HUGGINGFACE];
            if (!config.apiKey) {
                throw new Error('HuggingFace API key not configured. Please add your API key in the extension settings.');
            }
            return new HuggingFaceProvider(config.apiKey, config.model);
        }

        default:
            throw new Error(`Unknown AI provider: ${selectedProvider}`);
    }
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(provider: AIProviderEnum): string {
    switch (provider) {
        case AIProviderEnum.CLAUDE:
            return 'Claude (Anthropic)';
        case AIProviderEnum.GEMINI:
            return 'Gemini (Google)';
        case AIProviderEnum.HUGGINGFACE:
            return 'HuggingFace';
        default:
            return provider;
    }
}

/**
 * Get setup URL for a provider
 */
export function getProviderSetupUrl(provider: AIProviderEnum): string {
    switch (provider) {
        case AIProviderEnum.CLAUDE:
            return 'https://console.anthropic.com/';
        case AIProviderEnum.GEMINI:
            return 'https://aistudio.google.com/apikey';
        case AIProviderEnum.HUGGINGFACE:
            return 'https://huggingface.co/settings/tokens';
        default:
            return '';
    }
}
