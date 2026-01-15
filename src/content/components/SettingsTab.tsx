import React, { useEffect, useState } from 'react';
import { Check, Loader2, Trash2, ExternalLink, Key, Database } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import { AIProvider, ExtensionSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/constants';

// Provider info
const PROVIDER_INFO = {
    [AIProvider.GEMINI]: {
        name: 'Gemini (Google)',
        url: 'https://aistudio.google.com/apikey',
    },
    [AIProvider.CLAUDE]: {
        name: 'Claude (Anthropic)',
        url: 'https://console.anthropic.com/settings/keys',
    },
    [AIProvider.HUGGINGFACE]: {
        name: 'HuggingFace',
        url: 'https://huggingface.co/settings/tokens',
    },
};

const SettingsTab: React.FC = () => {
    const { settings, saveSettings, clearCache, loadSettings } = useAnalysisStore();

    const [localSettings, setLocalSettings] = useState<ExtensionSettings>(settings || DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [cacheStats, setCacheStats] = useState<{ count: number; sizeBytes: number } | null>(null);
    const [clearing, setClearing] = useState(false);

    // Update local settings when store settings change
    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
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

    const handleProviderChange = (provider: AIProvider) => {
        setLocalSettings({
            ...localSettings,
            ai: {
                ...localSettings.ai,
                selectedProvider: provider,
            },
        });
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

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        const success = await saveSettings(localSettings);

        setSaving(false);
        if (success) {
            setSaved(true);
            // Reload settings to update HomeTab and provider state
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

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* AI Provider Section */}
            <div>
                <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--gai-text-color)',
                    marginBottom: '8px',
                }}>
                    AI Provider
                </label>
                <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid var(--gai-border-color)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--gai-bg-primary)',
                        color: 'var(--gai-text-color)',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                >
                    {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                        <option key={key} value={key}>{info.name}</option>
                    ))}
                </select>
            </div>

            {/* API Key Section */}
            <div>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--gai-text-color)',
                    marginBottom: '4px',
                }}>
                    <Key size={14} />
                    API Key
                </label>
                <span style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'var(--gai-text-muted)',
                    marginBottom: '8px',
                }}>
                    Your API key is stored locally and never shared
                </span>
                <input
                    type="password"
                    value={currentApiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={`Enter your ${PROVIDER_INFO[selectedProvider].name} API key`}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid var(--gai-border-color)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--gai-bg-primary)',
                        color: 'var(--gai-text-color)',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                    }}
                />
                <a
                    href={PROVIDER_INFO[selectedProvider].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#8b5cf6',
                        textDecoration: 'none',
                        marginTop: '8px',
                    }}
                >
                    <ExternalLink size={12} />
                    Get your API key
                </a>
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
                    transition: 'all 0.2s ease',
                }}
            >
                {saving ? (
                    <Loader2 size={16} className="gai-spinner" />
                ) : saved ? (
                    <Check size={16} />
                ) : (
                    <Check size={16} />
                )}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </button>

            {/* Divider */}
            <div style={{
                height: '1px',
                backgroundColor: 'var(--gai-border-color)',
                margin: '4px 0',
            }} />

            {/* Cache Section */}
            <div>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--gai-text-color)',
                    marginBottom: '8px',
                }}>
                    <Database size={14} />
                    Cache
                </label>

                <div style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--gai-bg-secondary)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: 'var(--gai-text-muted)',
                    marginBottom: '12px',
                }}>
                    {cacheStats ? (
                        <>
                            {cacheStats.count} cached {cacheStats.count === 1 ? 'analysis' : 'analyses'}
                            {cacheStats.count > 0 && ` (${(cacheStats.sizeBytes / 1024).toFixed(1)} KB)`}
                        </>
                    ) : (
                        'Loading...'
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
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#f85149',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(248, 81, 73, 0.3)',
                            borderRadius: '8px',
                            cursor: clearing ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(248, 81, 73, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        {clearing ? (
                            <Loader2 size={14} className="gai-spinner" />
                        ) : (
                            <Trash2 size={14} />
                        )}
                        {clearing ? 'Clearing...' : 'Clear Cache'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SettingsTab;
