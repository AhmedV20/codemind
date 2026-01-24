import React, { useEffect, useState, useRef } from 'react';
import { Check, Loader2, Trash2, ExternalLink, Key, Database, Cpu, HardDrive, Clock, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import { AIProvider, ExtensionSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/constants';

// CDN URLs for AI Provider icons from homarr-labs/dashboard-icons
const PROVIDER_ICON_URLS: Record<AIProvider, string> = {
    [AIProvider.GEMINI]: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-gemini.svg',
    [AIProvider.CLAUDE]: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/claude-ai.svg',
    [AIProvider.HUGGINGFACE]: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/hugging-face.svg',
    [AIProvider.OPENROUTER]: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/open-router-dark.svg',
    [AIProvider.OPENAI]: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/openai-light.svg',
};

// Provider icon component using CDN images
const ProviderIcon: React.FC<{ provider: AIProvider; size?: number }> = ({ provider, size = 24 }) => (
    <img
        src={PROVIDER_ICON_URLS[provider]}
        alt={provider}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
    />
);

// Provider info with icons and colors
const PROVIDER_INFO: Record<AIProvider, { name: string; url: string; color: string; description: string; warning?: string }> = {
    [AIProvider.GEMINI]: {
        name: 'Gemini',
        url: 'https://aistudio.google.com/apikey',
        color: '#4285f4',
        description: 'Google AI • Free tier available',
    },
    [AIProvider.CLAUDE]: {
        name: 'Claude',
        url: 'https://console.anthropic.com/settings/keys',
        color: '#d97706',
        description: 'Anthropic • Paid API',
        warning: 'Requires browser access enabled on API key',
    },
    [AIProvider.HUGGINGFACE]: {
        name: 'HuggingFace',
        url: 'https://huggingface.co/settings/tokens',
        color: '#ff6b35',
        description: 'Open models • Free tier',
    },
    [AIProvider.OPENROUTER]: {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/settings/keys',
        color: '#10b981',
        description: 'Multi-provider • Free models',
    },
    [AIProvider.OPENAI]: {
        name: 'OpenAI',
        url: 'https://platform.openai.com/api-keys',
        color: '#00a67e',
        description: 'OpenAI • Paid API',
    },
};

// Model options for each provider
const MODEL_OPTIONS: Record<AIProvider, { value: string; label: string; description?: string }[]> = {
    [AIProvider.GEMINI]: [
        { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview', description: 'Latest & fastest' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Fast & efficient' },
        { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', description: 'Fast & cheap' },
    ],
    [AIProvider.CLAUDE]: [
        { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Latest & best' },
        { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet', description: 'Excellent balance' },
        { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', description: 'Fast & cheap' },
    ],
    [AIProvider.HUGGINGFACE]: [
        { value: 'Qwen/Qwen3-30B-A3B', label: 'Qwen3-30B-A3B', description: 'Fast MoE model' },
        { value: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B', description: 'High quality' },
        { value: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B', description: 'Lightweight' },
    ],
    [AIProvider.OPENROUTER]: [
        { value: 'openai/gpt-oss-20b', label: 'OpenAI GPT-20B', description: 'Free • Open Source' },
        { value: 'xiaomi/mimo-v2-flash:free', label: 'Xiaomi Mimo V2 Flash', description: 'Free • Fast' },
        { value: 'z-ai/glm-4.5-air:free', label: 'GLM-4.5-Air', description: 'Free • Fast' },
    ],
    [AIProvider.OPENAI]: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & affordable' },
        { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'High quality' },
    ],
};

const SettingsTab: React.FC = () => {
    const { settings, saveSettings, clearCache, deleteCurrentRepoCache, loadSettings, repoInfo, reset } = useAnalysisStore();

    const [localSettings, setLocalSettings] = useState<ExtensionSettings>(settings || DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [cacheStats, setCacheStats] = useState<{ count: number; sizeBytes: number } | null>(null);
    const [clearing, setClearing] = useState(false);
    const [customModel, setCustomModel] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [providerPage, setProviderPage] = useState(0);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    // Cached repos state
    const [cachedRepos, setCachedRepos] = useState<Array<{ fullName: string; branch: string; sizeBytes: number }>>([]);
    const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
    const [deletingRepos, setDeletingRepos] = useState(false);
    const [showRepoDropdown, setShowRepoDropdown] = useState(false);

    // Provider carousel settings
    const providersPerPage = 2;
    const providerList = Object.entries(PROVIDER_INFO) as [AIProvider, typeof PROVIDER_INFO[AIProvider]][];
    const totalPages = Math.ceil(providerList.length / providersPerPage);
    const currentProviders = providerList.slice(
        providerPage * providersPerPage,
        (providerPage + 1) * providersPerPage
    );

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
                setProviderDropdownOpen(false);
            }
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setModelDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update local settings when store settings change
    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
            const currentModel = settings.ai.providers[settings.ai.selectedProvider]?.model;
            const isCustom = currentModel && !MODEL_OPTIONS[settings.ai.selectedProvider]?.some(m => m.value === currentModel);
            if (isCustom) {
                setShowCustomInput(true);
                setCustomModel(currentModel || '');
            }
        }
    }, [settings]);

    // Load cache stats and cached repos
    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'GET_CACHE_STATS' }, (response) => {
            if (response?.stats) {
                setCacheStats(response.stats);
            }
        });
        chrome.runtime.sendMessage({ type: 'GET_CACHED_REPOS' }, (response) => {
            if (response?.repos) {
                setCachedRepos(response.repos);
            }
        });
    }, []);

    const selectedProvider = localSettings.ai.selectedProvider;
    const currentApiKey = localSettings.ai.providers[selectedProvider]?.apiKey || '';
    const currentModel = localSettings.ai.providers[selectedProvider]?.model || '';
    const providerInfo = PROVIDER_INFO[selectedProvider];

    const handleProviderChange = (provider: AIProvider) => {
        setLocalSettings({
            ...localSettings,
            ai: {
                ...localSettings.ai,
                selectedProvider: provider,
            },
        });
        setShowCustomInput(false);
        setCustomModel('');
        setProviderDropdownOpen(false);
    };

    const handleApiKeyChange = (apiKey: string) => {
        setLocalSettings({
            ...localSettings,
            ai: {
                ...localSettings.ai,
                providers: {
                    ...localSettings.ai.providers,
                    [selectedProvider]: {
                        ...localSettings.ai.providers[selectedProvider],
                        apiKey,
                    },
                },
            },
        });
    };

    const handleModelChange = (model: string) => {
        if (model === 'custom') {
            setShowCustomInput(true);
            setModelDropdownOpen(false);
            return;
        }
        setShowCustomInput(false);
        setLocalSettings({
            ...localSettings,
            ai: {
                ...localSettings.ai,
                providers: {
                    ...localSettings.ai.providers,
                    [selectedProvider]: {
                        ...localSettings.ai.providers[selectedProvider],
                        model,
                    },
                },
            },
        });
        setModelDropdownOpen(false);
    };

    const handleCustomModelChange = (model: string) => {
        setCustomModel(model);
        setLocalSettings({
            ...localSettings,
            ai: {
                ...localSettings.ai,
                providers: {
                    ...localSettings.ai.providers,
                    [selectedProvider]: {
                        ...localSettings.ai.providers[selectedProvider],
                        model,
                    },
                },
            },
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const success = await saveSettings(localSettings);
        setSaving(false);
        if (success) {
            setSaved(true);
            await loadSettings();
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleClearCache = async () => {
        setClearing(true);
        const success = await clearCache();
        setClearing(false);
        if (success) {
            setCacheStats({ count: 0, sizeBytes: 0 });
            setCachedRepos([]);
            setSelectedRepos(new Set());
        }
    };

    // Toggle repo selection
    const toggleRepoSelection = (repoKey: string) => {
        setSelectedRepos(prev => {
            const next = new Set(prev);
            if (next.has(repoKey)) {
                next.delete(repoKey);
            } else {
                next.add(repoKey);
            }
            return next;
        });
    };

    // Select/deselect all repos
    const toggleSelectAll = () => {
        if (selectedRepos.size === cachedRepos.length) {
            setSelectedRepos(new Set());
        } else {
            setSelectedRepos(new Set(cachedRepos.map(r => `${r.fullName}:${r.branch}`)));
        }
    };

    // Delete selected repos
    const handleDeleteSelectedRepos = async () => {
        if (selectedRepos.size === 0) return;
        setDeletingRepos(true);

        // Check if current repo is being deleted
        const currentKey = repoInfo ? `${repoInfo.owner}/${repoInfo.repo}:${repoInfo.branch}` : null;
        const deletingCurrentRepo = currentKey && selectedRepos.has(currentKey);

        const promises = Array.from(selectedRepos).map(key => {
            const colonIdx = key.lastIndexOf(':');
            const fullName = key.substring(0, colonIdx);
            const branch = key.substring(colonIdx + 1);
            return new Promise<void>((resolve) => {
                chrome.runtime.sendMessage({
                    type: 'DELETE_REPO_CACHE',
                    data: { fullName, branch }
                }, () => resolve());
            });
        });

        await Promise.all(promises);

        // Refresh cache data
        chrome.runtime.sendMessage({ type: 'GET_CACHE_STATS' }, (response) => {
            if (response?.stats) setCacheStats(response.stats);
        });
        chrome.runtime.sendMessage({ type: 'GET_CACHED_REPOS' }, (response) => {
            if (response?.repos) setCachedRepos(response.repos);
        });

        // Reset state if current repo was deleted (same as clearCache)
        if (deletingCurrentRepo) {
            reset();
        }

        setSelectedRepos(new Set());
        setDeletingRepos(false);
        setShowRepoDropdown(false);
    };

    // Delete current repo cache (quick action)
    const handleDeleteCurrentRepo = async () => {
        if (!repoInfo) return;
        setDeletingRepos(true);
        const success = await deleteCurrentRepoCache();
        setDeletingRepos(false);
        if (success) {
            // Refresh cache stats and repos list
            chrome.runtime.sendMessage({ type: 'GET_CACHE_STATS' }, (response) => {
                if (response?.stats) setCacheStats(response.stats);
            });
            chrome.runtime.sendMessage({ type: 'GET_CACHED_REPOS' }, (response) => {
                if (response?.repos) setCachedRepos(response.repos);
            });
        }
    };

    // Check if current repo is cached
    const currentRepoKey = repoInfo ? `${repoInfo.owner}/${repoInfo.repo}:${repoInfo.branch}` : null;
    const isCurrentRepoCached = currentRepoKey && cachedRepos.some(r => `${r.fullName}:${r.branch}` === currentRepoKey);

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const currentModelLabel = MODEL_OPTIONS[selectedProvider]?.find(m => m.value === currentModel)?.label || currentModel;

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* AI Provider Carousel */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                }}>
                    <label style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--gai-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        AI Provider
                    </label>
                    {/* Page indicator */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                    }}>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: i === providerPage ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)',
                                    transition: 'all 0.2s ease',
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    {/* Left Arrow */}
                    <button
                        onClick={() => setProviderPage(p => Math.max(0, p - 1))}
                        disabled={providerPage === 0}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            background: providerPage === 0 ? 'transparent' : 'rgba(139, 92, 246, 0.1)',
                            cursor: providerPage === 0 ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            opacity: providerPage === 0 ? 0.3 : 1,
                            flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                            if (providerPage > 0) {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = providerPage === 0 ? 'transparent' : 'rgba(139, 92, 246, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <ChevronLeft size={18} style={{ color: '#8b5cf6' }} />
                    </button>

                    {/* Provider Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px',
                        flex: 1,
                    }}>
                        {currentProviders.map(([key, info]) => {
                            const isSelected = key === selectedProvider;

                            return (
                                <button
                                    key={key}
                                    onClick={() => handleProviderChange(key as AIProvider)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        padding: '12px',
                                        backgroundColor: isSelected
                                            ? 'rgba(139, 92, 246, 0.1)'
                                            : 'var(--gai-bg-secondary)',
                                        border: isSelected
                                            ? '2px solid transparent'
                                            : '1px solid var(--gai-border-color)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        background: isSelected
                                            ? 'linear-gradient(var(--gai-bg-primary), var(--gai-bg-primary)) padding-box, linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%) border-box'
                                            : 'var(--gai-bg-secondary)',
                                        boxShadow: isSelected
                                            ? '0 4px 16px rgba(139, 92, 246, 0.25), inset 0 0 0 1px rgba(139, 92, 246, 0.1)'
                                            : 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.borderColor = 'var(--gai-border-color)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Check size={10} style={{ color: '#ffffff' }} />
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        backgroundColor: `${info.color}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${info.color}30`,
                                    }}>
                                        <ProviderIcon provider={key as AIProvider} size={20} />
                                    </div>

                                    {/* Text */}
                                    <div>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: 'var(--gai-text-color)',
                                            marginBottom: '1px',
                                        }}>
                                            {info.name}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: 'var(--gai-text-muted)',
                                            lineHeight: 1.2,
                                        }}>
                                            {info.description}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {/* Empty placeholders for grid alignment when less than 2 providers */}
                        {Array.from({ length: Math.max(0, providersPerPage - currentProviders.length) }).map((_, i) => (
                            <div key={`empty-${i}`} style={{
                                borderRadius: '12px',
                                border: '1px dashed rgba(139, 92, 246, 0.15)',
                                backgroundColor: 'transparent',
                                minHeight: '90px',
                            }} />
                        ))}
                    </div>

                    {/* Right Arrow with pulse animation */}
                    <button
                        onClick={() => setProviderPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={providerPage >= totalPages - 1}
                        className={providerPage < totalPages - 1 ? 'gai-pulse-arrow' : ''}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            background: providerPage >= totalPages - 1 ? 'transparent' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                            cursor: providerPage >= totalPages - 1 ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            opacity: providerPage >= totalPages - 1 ? 0.3 : 1,
                            flexShrink: 0,
                            boxShadow: providerPage < totalPages - 1 ? '0 0 0 0 rgba(139, 92, 246, 0.4)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (providerPage < totalPages - 1) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)';
                                e.currentTarget.style.transform = 'scale(1.15)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = providerPage >= totalPages - 1 ? 'transparent' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <ChevronRight size={18} style={{ color: '#8b5cf6' }} />
                    </button>
                </div>

                {/* Pulse animation keyframes */}
                <style>{`
                    @keyframes gai-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
                        70% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
                    }
                    .gai-pulse-arrow {
                        animation: gai-pulse 2s infinite;
                    }
                `}</style>
            </div>

            {/* API Key */}
            <div>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--gai-text-muted)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    <Key size={12} />
                    API Key
                </label>
                <input
                    type="password"
                    value={currentApiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={`Enter your ${providerInfo.name} API key`}
                    style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '14px',
                        border: '1px solid var(--gai-border-color)',
                        borderRadius: '10px',
                        backgroundColor: 'var(--gai-bg-secondary)',
                        color: 'var(--gai-text-color)',
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
                <a
                    href={providerInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: providerInfo.color,
                        textDecoration: 'none',
                        marginTop: '8px',
                    }}
                >
                    <ExternalLink size={12} />
                    Get your API key
                </a>
                {/* Provider-specific warning */}
                {providerInfo.warning && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginTop: '12px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        borderRadius: '8px',
                    }}>
                        <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
                        <span style={{
                            fontSize: '12px',
                            color: 'var(--gai-text-muted)',
                            lineHeight: 1.4,
                        }}>
                            {providerInfo.warning}
                        </span>
                    </div>
                )}
            </div>

            {/* Model Dropdown */}
            <div ref={modelDropdownRef} style={{ position: 'relative' }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--gai-text-muted)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    <Cpu size={12} />
                    Model
                </label>
                <button
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '12px 14px',
                        backgroundColor: 'var(--gai-bg-secondary)',
                        border: '1px solid var(--gai-border-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: 'var(--gai-text-color)',
                    }}
                >
                    <span>{showCustomInput ? 'Custom model' : currentModelLabel}</span>
                    <ChevronDown size={16} style={{
                        color: 'var(--gai-text-muted)',
                        transform: modelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }} />
                </button>

                {/* Model Dropdown Menu */}
                {modelDropdownOpen && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(22, 22, 24, 0.98)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        overflow: 'hidden',
                        zIndex: 100,
                        maxHeight: '250px',
                        overflowY: 'auto',
                    }}>
                        {MODEL_OPTIONS[selectedProvider]?.map((model) => (
                            <button
                                key={model.value}
                                onClick={() => handleModelChange(model.value)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '12px 14px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#e4e4e7' }}>
                                        {model.label}
                                    </div>
                                    {model.description && (
                                        <div style={{ fontSize: '11px', color: 'rgba(228, 228, 231, 0.5)' }}>
                                            {model.description}
                                        </div>
                                    )}
                                </div>
                                {currentModel === model.value && <Check size={16} style={{ color: '#10b981' }} />}
                            </button>
                        ))}
                        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '0 12px' }} />
                        <button
                            onClick={() => handleModelChange('custom')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '12px 14px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '13px',
                                color: '#a78bfa',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            ✏️ Custom model...
                        </button>
                    </div>
                )}

                {/* Custom Model Input */}
                {showCustomInput && (
                    <div style={{ marginTop: '8px' }}>
                        <input
                            type="text"
                            value={customModel}
                            onChange={(e) => handleCustomModelChange(e.target.value)}
                            placeholder="e.g., provider/model-name"
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                fontSize: '14px',
                                border: '1px solid var(--gai-border-color)',
                                borderRadius: '10px',
                                backgroundColor: 'var(--gai-bg-secondary)',
                                color: 'var(--gai-text-color)',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    background: saved
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                }}
            >
                {saving ? <Loader2 size={16} className="gai-spinner" /> : <Check size={16} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </button>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--gai-border-color)' }} />

            {/* Cache Section */}
            <div>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--gai-text-muted)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    <Database size={12} />
                    Cache
                </label>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--gai-bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                }}>
                    {cacheStats ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'rgba(139, 92, 246, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <HardDrive size={16} style={{ color: '#8b5cf6' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gai-text-color)' }}>
                                        {cacheStats.count}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--gai-text-muted)' }}>
                                        {cacheStats.count === 1 ? 'analysis' : 'analyses'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Clock size={16} style={{ color: '#3b82f6' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gai-text-color)' }}>
                                        {formatBytes(cacheStats.sizeBytes)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--gai-text-muted)' }}>stored</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', color: 'var(--gai-text-muted)', fontSize: '13px' }}>
                            <Loader2 size={14} className="gai-spinner" style={{ marginRight: '8px' }} />
                            Loading...
                        </div>
                    )}
                </div>

                {cacheStats && cacheStats.count > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Current repo quick delete */}
                        {isCurrentRepoCached && repoInfo && (
                            <button
                                onClick={handleDeleteCurrentRepo}
                                disabled={deletingRepos}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#f59e0b',
                                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '8px',
                                    cursor: deletingRepos ? 'wait' : 'pointer',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)'}
                            >
                                {deletingRepos ? <Loader2 size={14} className="gai-spinner" /> : <Trash2 size={14} />}
                                <span style={{ flex: 1 }}>
                                    Delete cache for <strong>{repoInfo.owner}/{repoInfo.repo}</strong>
                                </span>
                            </button>
                        )}

                        {/* Multi-select dropdown for other repos */}
                        {cachedRepos.length > 1 && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowRepoDropdown(!showRepoDropdown)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: 'var(--gai-text-color)',
                                        backgroundColor: 'var(--gai-bg-secondary)',
                                        border: '1px solid var(--gai-border-color)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Database size={14} style={{ color: '#8b5cf6' }} />
                                        Select repositories ({selectedRepos.size} selected)
                                    </span>
                                    <ChevronDown size={14} style={{
                                        color: 'var(--gai-text-muted)',
                                        transform: showRepoDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                    }} />
                                </button>

                                {/* Dropdown */}
                                {showRepoDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: '4px',
                                        backgroundColor: 'var(--gai-bg-primary)',
                                        border: '1px solid var(--gai-border-color)',
                                        borderRadius: '8px',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                                        zIndex: 100,
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                    }}>
                                        {/* Select All */}
                                        <button
                                            onClick={toggleSelectAll}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                width: '100%',
                                                padding: '10px 12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#8b5cf6',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                borderBottom: '1px solid var(--gai-border-muted)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                border: '2px solid #8b5cf6',
                                                backgroundColor: selectedRepos.size === cachedRepos.length ? '#8b5cf6' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                {selectedRepos.size === cachedRepos.length && <Check size={10} style={{ color: '#fff' }} />}
                                            </div>
                                            {selectedRepos.size === cachedRepos.length ? 'Deselect All' : 'Select All'}
                                        </button>

                                        {/* Repo list */}
                                        {cachedRepos.map((repo) => {
                                            const repoKey = `${repo.fullName}:${repo.branch}`;
                                            const isSelected = selectedRepos.has(repoKey);
                                            const isCurrent = repoKey === currentRepoKey;

                                            return (
                                                <button
                                                    key={repoKey}
                                                    onClick={() => toggleRepoSelection(repoKey)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        fontSize: '12px',
                                                        color: 'var(--gai-text-color)',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <div style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        borderRadius: '4px',
                                                        border: isSelected ? '2px solid #8b5cf6' : '1px solid var(--gai-border-color)',
                                                        backgroundColor: isSelected ? '#8b5cf6' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        {isSelected && <Check size={10} style={{ color: '#fff' }} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {repo.fullName}
                                                            {isCurrent && <span style={{ color: '#10b981', marginLeft: '6px', fontSize: '10px' }}>• current</span>}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: 'var(--gai-text-muted)' }}>
                                                            {repo.branch} · {formatBytes(repo.sizeBytes)}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Delete selected button */}
                        {selectedRepos.size > 0 && (
                            <button
                                onClick={handleDeleteSelectedRepos}
                                disabled={deletingRepos}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 16px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#fff',
                                    backgroundColor: '#f85149',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: deletingRepos ? 'wait' : 'pointer',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#da3633'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f85149'}
                            >
                                {deletingRepos ? <Loader2 size={14} className="gai-spinner" /> : <Trash2 size={14} />}
                                Delete {selectedRepos.size} selected {selectedRepos.size === 1 ? 'repository' : 'repositories'}
                            </button>
                        )}

                        {/* Clear all cache */}
                        <button
                            onClick={handleClearCache}
                            disabled={clearing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '10px 16px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--gai-text-muted)',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--gai-border-muted)',
                                borderRadius: '8px',
                                cursor: clearing ? 'wait' : 'pointer',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gai-bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {clearing ? <Loader2 size={14} className="gai-spinner" /> : <Trash2 size={14} />}
                            {clearing ? 'Clearing all...' : 'Clear all cache'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsTab;
