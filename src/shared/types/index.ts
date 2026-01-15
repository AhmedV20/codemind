// ============================================
// Repository Types
// ============================================

export interface RepositoryInfo {
    owner: string;
    repo: string;
    branch: string;
    url: string;
}

export interface RepositoryMetadata {
    name: string;
    fullName: string;
    description: string | null;
    stars: number;
    forks: number;
    watchers: number;
    language: string | null;
    topics: string[];
    license: string | null;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    defaultBranch: string;
    isArchived: boolean;
    isFork: boolean;
}

export interface RepositoryStructure {
    tree: FileTreeItem[];
    truncated: boolean;
}

export interface FileTreeItem {
    path: string;
    type: 'blob' | 'tree';
    size?: number;
}

export interface ReleaseInfo {
    tagName: string;
    name: string;
    body: string;
    publishedAt: string;
    isPrerelease: boolean;
    assets: ReleaseAsset[];
}

export interface ReleaseAsset {
    name: string;
    downloadUrl: string;
    size: number;
    downloadCount: number;
}

export interface RepositoryData {
    info: RepositoryInfo;
    metadata: RepositoryMetadata;
    readme: string | null;
    structure: RepositoryStructure;
    releases: ReleaseInfo[];
    keyFiles: KeyFile[];
}

export interface KeyFile {
    path: string;
    content: string;
    type: 'config' | 'source' | 'docs';
}

// ============================================
// Analysis Types
// ============================================

export interface Analysis {
    repoInfo: RepositoryInfo;
    content: string;
    sections: AnalysisSections;
    generatedAt: string;
    provider: AIProvider;
    fromCache: boolean;
}

export interface AnalysisSections {
    summary: string;
    whatItDoes: string;
    whoItsFor: string;
    keyFeatures: string[];
    techStack: TechStackItem[];
    gettingStarted: string;
    downloadInfo?: DownloadInfo;
}

export interface TechStackItem {
    name: string;
    description: string;
}

export interface DownloadInfo {
    hasReleases: boolean;
    latestVersion?: string;
    platforms?: PlatformDownload[];
    installInstructions?: string;
}

export interface PlatformDownload {
    platform: 'windows' | 'macos' | 'linux' | 'other';
    filename: string;
    downloadUrl: string;
    size: number;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface ConversationContext {
    repoData: RepositoryData;
    analysis: Analysis;
    messages: ChatMessage[];
}

// ============================================
// AI Provider Types
// ============================================

export enum AIProvider {
    CLAUDE = 'claude',
    GEMINI = 'gemini',
    HUGGINGFACE = 'huggingface',
}

export interface ProviderConfig {
    provider: AIProvider;
    apiKey: string;
    model?: string; // For HuggingFace model selection
}

export interface AIProviderSettings {
    selectedProvider: AIProvider;
    providers: {
        [AIProvider.CLAUDE]: {
            apiKey: string;
            model: string;
        };
        [AIProvider.GEMINI]: {
            apiKey: string;
            model: string;
        };
        [AIProvider.HUGGINGFACE]: {
            apiKey: string;
            model: string;
        };
    };
}

// ============================================
// Settings Types
// ============================================

export interface ExtensionSettings {
    ai: AIProviderSettings;
    analysis: {
        depth: 'quick' | 'standard' | 'deep';
        autoAnalyze: boolean;
        cacheDuration: number; // in hours
    };
    ui: {
        panelPosition: 'right' | 'left';
        theme: 'auto' | 'light' | 'dark';
        fontSize: 'small' | 'medium' | 'large';
    };
}

// ============================================
// Message Types (for chrome.runtime messaging)
// ============================================

export type MessageType =
    | 'ANALYZE_REPO'
    | 'ANALYSIS_CHUNK'
    | 'ANALYSIS_COMPLETE'
    | 'ANALYSIS_ERROR'
    | 'CHAT_MESSAGE'
    | 'CHAT_RESPONSE_CHUNK'
    | 'CHAT_COMPLETE'
    | 'CHAT_ERROR'
    | 'GET_SETTINGS'
    | 'SAVE_SETTINGS'
    | 'CLEAR_CACHE';

export interface BaseMessage {
    type: MessageType;
}

export interface AnalyzeRepoMessage extends BaseMessage {
    type: 'ANALYZE_REPO';
    data: RepositoryInfo;
}

export interface AnalysisChunkMessage extends BaseMessage {
    type: 'ANALYSIS_CHUNK';
    chunk: string;
}

export interface AnalysisCompleteMessage extends BaseMessage {
    type: 'ANALYSIS_COMPLETE';
    data: Analysis;
    fromCache: boolean;
}

export interface AnalysisErrorMessage extends BaseMessage {
    type: 'ANALYSIS_ERROR';
    error: string;
}

export interface ChatMessageRequest extends BaseMessage {
    type: 'CHAT_MESSAGE';
    data: {
        repoInfo: RepositoryInfo;
        question: string;
        history: ChatMessage[];
    };
}

export interface ChatResponseChunkMessage extends BaseMessage {
    type: 'CHAT_RESPONSE_CHUNK';
    chunk: string;
}

export interface ChatCompleteMessage extends BaseMessage {
    type: 'CHAT_COMPLETE';
    message: ChatMessage;
}

export interface ChatErrorMessage extends BaseMessage {
    type: 'CHAT_ERROR';
    error: string;
}

export type ExtensionMessage =
    | AnalyzeRepoMessage
    | AnalysisChunkMessage
    | AnalysisCompleteMessage
    | AnalysisErrorMessage
    | ChatMessageRequest
    | ChatResponseChunkMessage
    | ChatCompleteMessage
    | ChatErrorMessage;

// ============================================
// Cache Types
// ============================================

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

// ============================================
// UI State Types
// ============================================

export interface AnalysisState {
    status: 'idle' | 'loading' | 'streaming' | 'complete' | 'error';
    analysis: Analysis | null;
    streamingContent: string;
    error: string | null;
    isPanelOpen: boolean;
}

export interface ChatState {
    chatMessages: ChatMessage[];
    chatStatus: 'idle' | 'loading' | 'error';
    chatStreamingContent: string;
    chatError: string | null;
}
