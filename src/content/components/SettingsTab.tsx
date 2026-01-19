import React, { useEffect, useState, useRef } from 'react';
import { Check, Loader2, Trash2, ExternalLink, Key, Database, Cpu, HardDrive, Clock, ChevronDown } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import { AIProvider, ExtensionSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/constants';

// Provider info with icons and colors
const PROVIDER_INFO: Record<AIProvider, { name: string; url: string; color: string; description: string }> = {
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
};

const SettingsTab: React.FC = () => {
    const { settings, saveSettings, clearCache, loadSettings } = useAnalysisStore();

    const [localSettings, setLocalSettings] = useState<ExtensionSettings>(settings || DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [cacheStats, setCacheStats] = useState<{ count: number; sizeBytes: number } | null>(null);
    const [clearing, setClearing] = useState(false);
    const [customModel, setCustomModel] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

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

    // Load cache stats
    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'GET_CACHE_STATS' }, (response) => {
            if (response?.stats) {
                setCacheStats(response.stats);
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
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const currentModelLabel = MODEL_OPTIONS[selectedProvider]?.find(m => m.value === currentModel)?.label || currentModel;

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* AI Provider Dropdown */}
            <div ref={providerDropdownRef} style={{ position: 'relative' }}>
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--gai-text-muted)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    AI Provider
                </label>
                <button
                    onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 14px',
                        backgroundColor: 'var(--gai-bg-secondary)',
                        border: '1px solid var(--gai-border-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: `${providerInfo.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Cpu size={16} style={{ color: providerInfo.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--gai-text-color)' }}>
                            {providerInfo.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gai-text-muted)' }}>
                            {providerInfo.description}
                        </div>
                    </div>
                    <ChevronDown size={16} style={{
                        color: 'var(--gai-text-muted)',
                        transform: providerDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }} />
                </button>

                {/* Provider Dropdown Menu */}
                {providerDropdownOpen && (
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
                    }}>
                        {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                            <button
                                key={key}
                                onClick={() => handleProviderChange(key as AIProvider)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
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
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    backgroundColor: `${info.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Cpu size={16} style={{ color: info.color }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#e4e4e7' }}>
                                        {info.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(228, 228, 231, 0.5)' }}>
                                        {info.description}
                                    </div>
                                </div>
                                {key === selectedProvider && <Check size={16} style={{ color: '#10b981' }} />}
                            </button>
                        ))}
                    </div>
                )}
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
                    <button
                        onClick={handleClearCache}
                        disabled={clearing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            marginTop: '12px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#f85149',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(248, 81, 73, 0.3)',
                            borderRadius: '8px',
                            cursor: clearing ? 'wait' : 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 81, 73, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {clearing ? <Loader2 size={14} className="gai-spinner" /> : <Trash2 size={14} />}
                        {clearing ? 'Clearing...' : 'Clear Cache'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SettingsTab;
