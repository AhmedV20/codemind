import { create } from 'zustand';
import {
    RepositoryInfo,
    Analysis,
    ChatMessage,
    AnalysisState,
    ChatState,
    ExtensionSettings
} from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/constants';

const PROVIDER_NAMES: Record<string, string> = {
    gemini: 'Gemini',
    claude: 'Claude',
    huggingface: 'HuggingFace',
    openrouter: 'OpenRouter',
    openai: 'OpenAI',
};

// Throttle settings
const THROTTLE_COOLDOWN_MS = 30000; // 30 seconds
const THROTTLE_MAX_REQUESTS = 2;
const THROTTLE_STORAGE_KEY = 'codemind-throttle';

function getThrottleState(): { requests: number[] } {
    try {
        const data = localStorage.getItem(THROTTLE_STORAGE_KEY);
        return data ? JSON.parse(data) : { requests: [] };
    } catch {
        return { requests: [] };
    }
}

function saveThrottleState(state: { requests: number[] }): void {
    try {
        localStorage.setItem(THROTTLE_STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Ignore storage errors
    }
}

interface AnalysisStore extends AnalysisState, ChatState {
    // Repository info
    repoInfo: RepositoryInfo | null;

    // Settings
    settings: ExtensionSettings | null;
    hasApiKey: boolean;
    availableProviders: Array<{ provider: string; name: string }>;
    hasCachedAnalysis: boolean;

    // Active tab
    activeTab: 'home' | 'settings';

    // Throttle state
    cooldownRemaining: number;
    setCooldownRemaining: (ms: number) => void;

    // Actions
    setRepoInfo: (info: RepositoryInfo) => void;
    startAnalysis: (forceRefresh?: boolean) => void;
    checkCache: () => Promise<void>;
    loadCachedAnalysis: () => Promise<void>;
    showPanel: () => void;
    hidePanel: () => void;
    setActiveTab: (tab: 'home' | 'settings') => void;
    setSelectedProvider: (provider: string) => void;
    loadSettings: () => Promise<void>;
    saveSettings: (settings: ExtensionSettings) => Promise<boolean>;
    saveGitHubToken: (token: string) => Promise<boolean>;
    clearCache: () => Promise<boolean>;
    deleteCurrentRepoCache: () => Promise<boolean>;
    sendChatMessage: (message: string) => void;
    reset: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
    // Initial state
    repoInfo: null,
    status: 'idle',
    analysis: null,
    streamingContent: '',
    error: null,
    isPanelOpen: false,

    // Settings state
    settings: null,
    hasApiKey: false,
    availableProviders: [],
    hasCachedAnalysis: false,
    activeTab: 'home',

    // Chat state
    chatMessages: [],
    chatStatus: 'idle',
    chatStreamingContent: '',
    chatError: null,

    // Throttle state
    cooldownRemaining: 0,
    setCooldownRemaining: (ms) => set({ cooldownRemaining: ms }),

    // Actions
    setRepoInfo: (info) => set({ repoInfo: info }),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setSelectedProvider: (provider) => {
        const { settings } = get();
        if (!settings) return;

        const newSettings = {
            ...settings,
            ai: {
                ...settings.ai,
                selectedProvider: provider as any,
            },
        };

        chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: newSettings });

        const apiKey = newSettings.ai.providers[provider as keyof typeof newSettings.ai.providers]?.apiKey || '';
        set({
            settings: newSettings,
            hasApiKey: apiKey.length > 0,
        });
    },

    loadSettings: async () => {
        try {
            const response = await new Promise<{ settings?: ExtensionSettings }>((resolve) => {
                chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, resolve);
            });

            if (response?.settings) {
                const settings = response.settings;
                const selectedProvider = settings.ai.selectedProvider;
                const apiKey = settings.ai.providers[selectedProvider]?.apiKey || '';

                // Compute available providers (those with API keys)
                const available: Array<{ provider: string; name: string }> = [];
                for (const [key, config] of Object.entries(settings.ai.providers)) {
                    if (config.apiKey && config.apiKey.length > 0) {
                        available.push({ provider: key, name: PROVIDER_NAMES[key] || key });
                    }
                }

                set({
                    settings,
                    hasApiKey: apiKey.length > 0,
                    availableProviders: available,
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            set({ settings: DEFAULT_SETTINGS, hasApiKey: false });
        }
    },

    saveSettings: async (newSettings) => {
        try {
            await new Promise<void>((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: newSettings }, (response) => {
                    if (response?.error) reject(new Error(response.error));
                    else resolve();
                });
            });

            const selectedProvider = newSettings.ai.selectedProvider;
            const apiKey = newSettings.ai.providers[selectedProvider]?.apiKey || '';
            set({
                settings: newSettings,
                hasApiKey: apiKey.length > 0
            });
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    },

    clearCache: async () => {
        try {
            await new Promise<void>((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, (response) => {
                    if (response?.error) reject(new Error(response.error));
                    else resolve();
                });
            });
            // Reset to default state so HomeTab shows initial view
            set({
                hasCachedAnalysis: false,
                status: 'idle',
                analysis: null,
                streamingContent: '',
                error: null,
                chatMessages: [],
                chatStatus: 'idle',
                chatStreamingContent: '',
                chatError: null,
            });
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    },

    deleteCurrentRepoCache: async () => {
        const { repoInfo } = get();
        if (!repoInfo) return false;

        try {
            await new Promise<void>((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: 'DELETE_REPO_CACHE',
                    data: {
                        fullName: `${repoInfo.owner}/${repoInfo.repo}`,
                        branch: repoInfo.branch
                    }
                }, (response) => {
                    if (response?.error) reject(new Error(response.error));
                    else resolve();
                });
            });
            // Reset state (same as clearCache)
            set({
                hasCachedAnalysis: false,
                status: 'idle',
                analysis: null,
                streamingContent: '',
                error: null,
                chatMessages: [],
                chatStatus: 'idle',
                chatStreamingContent: '',
                chatError: null,
            });
            return true;
        } catch (error) {
            console.error('Failed to delete repo cache:', error);
            return false;
        }
    },

    saveGitHubToken: async (token: string) => {
        const { settings, saveSettings } = get();
        if (!settings) return false;

        const newSettings = {
            ...settings,
            github: {
                ...settings.github,
                token,
            },
        };

        return saveSettings(newSettings);
    },

    checkCache: async () => {
        const { repoInfo } = get();
        if (!repoInfo) {
            set({ hasCachedAnalysis: false });
            return;
        }

        try {
            const response = await new Promise<{ hasCached: boolean }>((resolve) => {
                chrome.runtime.sendMessage({
                    type: 'CHECK_CACHE',
                    data: { owner: repoInfo.owner, repo: repoInfo.repo, branch: repoInfo.branch }
                }, resolve);
            });
            set({ hasCachedAnalysis: response?.hasCached || false });
        } catch (error) {
            console.error('Failed to check cache:', error);
            set({ hasCachedAnalysis: false });
        }
    },

    loadCachedAnalysis: async () => {
        const { repoInfo } = get();
        if (!repoInfo) return;

        try {
            const response = await new Promise<{ analysis: Analysis | null }>((resolve) => {
                chrome.runtime.sendMessage({
                    type: 'LOAD_CACHE',
                    data: { owner: repoInfo.owner, repo: repoInfo.repo, branch: repoInfo.branch }
                }, resolve);
            });

            if (response?.analysis) {
                set({
                    status: 'complete',
                    analysis: response.analysis,
                    streamingContent: '',
                    error: null,
                });
            }
        } catch (error) {
            console.error('Failed to load cached analysis:', error);
        }
    },

    startAnalysis: async (forceRefresh = false) => {
        const { repoInfo, hasApiKey, hasCachedAnalysis, settings, setCooldownRemaining } = get();
        if (!repoInfo) return;

        // Check throttle state (only for non-cached requests)
        const now = Date.now();
        const throttle = getThrottleState();
        const recentRequests = throttle.requests.filter(
            (t: number) => now - t < THROTTLE_COOLDOWN_MS
        );

        // If not just loading from cache, check throttle
        if (forceRefresh || !hasCachedAnalysis) {
            if (recentRequests.length >= THROTTLE_MAX_REQUESTS) {
                const oldestRequest = Math.min(...recentRequests);
                const remaining = THROTTLE_COOLDOWN_MS - (now - oldestRequest);
                setCooldownRemaining(remaining);
                return;
            }
        }

        // For forceRefresh, check API key directly from settings
        let apiKeyValid = hasApiKey;
        if (forceRefresh && settings) {
            const selectedProvider = settings.ai.selectedProvider;
            const apiKey = settings.ai.providers[selectedProvider]?.apiKey || '';
            apiKeyValid = apiKey.length > 0;
        }

        // Check if API key is set
        if (!apiKeyValid) {
            set({
                status: 'error',
                error: 'API_KEY_REQUIRED'
            });
            return;
        }

        // If not forcing refresh and we have cache, load from cache
        if (!forceRefresh && hasCachedAnalysis) {
            await get().loadCachedAnalysis();
            return;
        }

        // Track this request for throttling
        saveThrottleState({ requests: [...recentRequests, now] });

        // Clear current analysis when regenerating
        set({
            status: 'loading',
            error: null,
            streamingContent: '',
            analysis: forceRefresh ? null : get().analysis, // Clear analysis on regenerate
        });

        try {
            // Send message to background script
            chrome.runtime.sendMessage({
                type: 'ANALYZE_REPO',
                data: repoInfo
            }, (response) => {
                if (chrome.runtime.lastError) {
                    set({
                        status: 'error',
                        error: chrome.runtime.lastError.message || 'Failed to start analysis'
                    });
                }
            });
        } catch (error) {
            set({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to start analysis'
            });
        }
    },

    showPanel: async () => {
        const store = get();
        // Load settings when opening panel
        await store.loadSettings();
        set({ isPanelOpen: true });

        // If we have cached analysis, load it automatically
        if (store.hasCachedAnalysis && !store.analysis) {
            store.loadCachedAnalysis();
        }
    },

    hidePanel: () => set({ isPanelOpen: false }),

    sendChatMessage: async (message) => {
        const { repoInfo, chatMessages, analysis } = get();
        if (!repoInfo || !analysis) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };

        set({
            chatMessages: [...chatMessages, userMessage],
            chatStatus: 'loading',
            chatStreamingContent: '',
            chatError: null,
        });

        try {
            chrome.runtime.sendMessage({
                type: 'CHAT_MESSAGE',
                data: {
                    repoInfo,
                    question: message,
                    history: [...chatMessages, userMessage],
                }
            });
        } catch (error) {
            set({
                chatStatus: 'error',
                chatError: error instanceof Error ? error.message : 'Failed to send message'
            });
        }
    },

    reset: () => set({
        status: 'idle',
        analysis: null,
        streamingContent: '',
        error: null,
        isPanelOpen: false,
        chatMessages: [],
        chatStatus: 'idle',
        chatStreamingContent: '',
        chatError: null,
    }),
}));

// Message listener for background script responses
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        switch (message.type) {
            case 'ANALYSIS_CHUNK':
                useAnalysisStore.setState((state) => ({
                    status: 'streaming',
                    streamingContent: state.streamingContent + message.chunk,
                }));
                break;

            case 'ANALYSIS_COMPLETE':
                useAnalysisStore.setState({
                    status: 'complete',
                    analysis: message.data,
                    streamingContent: '',
                });
                break;

            case 'ANALYSIS_ERROR':
                useAnalysisStore.setState({
                    status: 'error',
                    error: message.error,
                });
                break;

            case 'CHAT_RESPONSE_CHUNK':
                useAnalysisStore.setState((state) => ({
                    chatStatus: 'loading',
                    chatStreamingContent: state.chatStreamingContent + message.chunk,
                }));
                break;

            case 'CHAT_COMPLETE':
                useAnalysisStore.setState((state) => ({
                    chatStatus: 'idle',
                    chatMessages: [...state.chatMessages, message.message],
                    chatStreamingContent: '',
                }));
                break;

            case 'CHAT_ERROR':
                useAnalysisStore.setState({
                    chatStatus: 'error',
                    chatError: message.error,
                });
                break;
        }

        sendResponse({ received: true });
        return true;
    });
}
