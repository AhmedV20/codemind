import {
    AnalyzeRepoMessage,
    ChatMessageRequest,
    ExtensionSettings
} from '@shared/types';
import { analysisService } from './services/analysis';
import { cacheManager } from './services/cache';
import { settingsManager } from './services/settings';

console.log('[GitHub AI Analyzer] Background service worker starting...');

// Generic message type for all extension messages
interface GenericMessage {
    type: string;
    data?: unknown;
    settings?: ExtensionSettings;
}

/**
 * Unified message handler for all extension communication
 */
chrome.runtime.onMessage.addListener((
    message: GenericMessage,
    sender,
    sendResponse
) => {
    const tabId = sender.tab?.id;

    console.log('[Background] Received message:', message.type);

    // Handle each message type
    switch (message.type) {
        // Content script messages
        case 'ANALYZE_REPO':
            handleAnalyzeRepo(message as AnalyzeRepoMessage, tabId);
            sendResponse({ received: true });
            break;

        case 'CHAT_MESSAGE':
            handleChatMessage(message as ChatMessageRequest, tabId);
            sendResponse({ received: true });
            break;

        // Popup messages
        case 'GET_SETTINGS':
            settingsManager.get().then(settings => {
                sendResponse({ settings });
            });
            return true; // Async response

        case 'SAVE_SETTINGS':
            if (message.settings) {
                settingsManager.save(message.settings).then(() => {
                    // Explicitly clear cache to ensure next read gets fresh data
                    settingsManager.clearCache();
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ error: error.message });
                });
            } else {
                sendResponse({ error: 'No settings provided' });
            }
            return true; // Async response

        case 'CLEAR_CACHE':
            cacheManager.clearAll().then(() => {
                sendResponse({ success: true });
            }).catch(error => {
                sendResponse({ error: error.message });
            });
            return true; // Async response

        case 'GET_CACHE_STATS':
            cacheManager.getStats().then(stats => {
                sendResponse({ stats });
            });
            return true; // Async response

        case 'CHECK_CACHE':
            if (message.data) {
                const { owner, repo, branch } = message.data as { owner: string; repo: string; branch: string };
                cacheManager.hasCache(owner, repo, branch).then(hasCached => {
                    sendResponse({ hasCached });
                });
            } else {
                sendResponse({ hasCached: false });
            }
            return true; // Async response

        case 'LOAD_CACHE':
            if (message.data) {
                const { owner, repo, branch } = message.data as { owner: string; repo: string; branch: string };
                cacheManager.get(owner, repo, branch).then(analysis => {
                    sendResponse({ analysis });
                });
            } else {
                sendResponse({ analysis: null });
            }
            return true; // Async response

        default:
            // Ignore unknown message types (don't send error)
            console.log('[Background] Ignoring message type:', message.type);
            return false;
    }

    // Return true to indicate async response for content script messages
    return true;
});

/**
 * Handle repository analysis request
 */
async function handleAnalyzeRepo(
    message: AnalyzeRepoMessage,
    tabId: number | undefined
): Promise<void> {
    if (!tabId) {
        console.error('[Background] No tab ID for ANALYZE_REPO');
        return;
    }

    try {
        const analysis = await analysisService.analyzeRepository(
            message.data,
            (chunk) => {
                // Stream chunks to content script
                chrome.tabs.sendMessage(tabId, {
                    type: 'ANALYSIS_CHUNK',
                    chunk,
                });
            }
        );

        // Send completion message
        chrome.tabs.sendMessage(tabId, {
            type: 'ANALYSIS_COMPLETE',
            data: analysis,
            fromCache: analysis.fromCache,
        });

    } catch (error) {
        console.error('[Background] Analysis error:', error);
        chrome.tabs.sendMessage(tabId, {
            type: 'ANALYSIS_ERROR',
            error: error instanceof Error ? error.message : 'Analysis failed',
        });
    }
}

/**
 * Handle chat message request
 */
async function handleChatMessage(
    message: ChatMessageRequest,
    tabId: number | undefined
): Promise<void> {
    if (!tabId) {
        console.error('[Background] No tab ID for CHAT_MESSAGE');
        return;
    }

    try {
        const { repoInfo, question, history } = message.data;

        const response = await analysisService.handleChatMessage(
            repoInfo,
            question,
            history,
            (chunk) => {
                // Stream chunks to content script
                chrome.tabs.sendMessage(tabId, {
                    type: 'CHAT_RESPONSE_CHUNK',
                    chunk,
                });
            }
        );

        // Send completion message
        chrome.tabs.sendMessage(tabId, {
            type: 'CHAT_COMPLETE',
            message: response,
        });

    } catch (error) {
        console.error('[Background] Chat error:', error);
        chrome.tabs.sendMessage(tabId, {
            type: 'CHAT_ERROR',
            error: error instanceof Error ? error.message : 'Chat failed',
        });
    }
}

/**
 * Handle extension install/update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('[Background] Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
        // First install - could open options page
        console.log('[Background] First install - settings initialized with defaults');
    }

    if (details.reason === 'update') {
        // Extension updated - clear settings cache to pick up new defaults
        settingsManager.clearCache();
    }
});

console.log('[GitHub AI Analyzer] Background service worker ready');

