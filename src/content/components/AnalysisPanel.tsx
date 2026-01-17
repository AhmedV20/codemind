import React, { useEffect, useRef, useState } from 'react';
import { X, Home, Settings, Brain, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import HomeTab from './HomeTab';
import SettingsTab from './SettingsTab';
import ExportDropdown from './ExportDropdown';

const AnalysisPanel: React.FC = () => {
    const {
        status,
        hidePanel,
        repoInfo,
        activeTab,
        setActiveTab,
        startAnalysis,
        availableProviders,
        settings,
        setSelectedProvider,
        analysis,
    } = useAnalysisStore();

    const panelRef = useRef<HTMLDivElement>(null);
    const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hidePanel();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hidePanel]);

    // Prevent body scroll when panel is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const isLoading = status === 'loading' || status === 'streaming';

    return (
        <>
            {/* Backdrop */}
            <div
                className="gai-backdrop"
                onClick={hidePanel}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 9998,
                }}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className="gai-panel"
                style={{
                    position: 'fixed',
                    top: '12px',
                    right: '12px',
                    bottom: '12px',
                    width: '500px',
                    backgroundColor: 'var(--glass-bg)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    boxShadow: 'var(--glass-shadow-lg), inset 0 0 0 1px var(--glass-border)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'gai-slide-in 0.3s ease-out',
                    borderRadius: '24px',
                    overflow: 'hidden',
                }}
            >
                {/* Minimal Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--glass-border)',
                    }}
                >
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                        }}>
                            <Brain size={22} color="#fff" />
                        </div>
                        <div>
                            <span style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: 'var(--gai-text-color)',
                                display: 'block',
                            }}>
                                CodeMind
                            </span>
                            {repoInfo && (
                                <span style={{
                                    fontSize: '12px',
                                    color: 'var(--gai-text-muted)',
                                }}>
                                    {repoInfo.owner}/{repoInfo.repo}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Header Actions (right side) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Export Dropdown - Show when analysis exists */}
                        {(status === 'complete' || analysis) && (
                            <ExportDropdown analysis={analysis} repoInfo={repoInfo} />
                        )}

                        {/* Close button */}
                        <button
                            onClick={hidePanel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                border: 'none',
                                borderRadius: '50%',
                                backgroundColor: 'var(--gai-bg-secondary)',
                                cursor: 'pointer',
                                color: 'var(--gai-text-muted)',
                                transition: 'all 0.2s ease',
                            }}
                            title="Close (Esc)"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--gai-bg-tertiary)';
                                e.currentTarget.style.color = 'var(--gai-text-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--gai-bg-secondary)';
                                e.currentTarget.style.color = 'var(--gai-text-muted)';
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Tab Content - Scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'home' ? <HomeTab /> : <SettingsTab />}
                </div>

                {/* Bottom Navigation Pill */}
                <div style={{
                    padding: '12px 20px 20px',
                    display: 'flex',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px',
                        backgroundColor: 'var(--nav-pill-bg)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '50px',
                        boxShadow: 'var(--nav-pill-shadow)',
                    }}>
                        {/* Home Tab */}
                        <button
                            onClick={() => setActiveTab('home')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: activeTab === 'home' ? '10px 20px' : '10px 16px',
                                border: 'none',
                                borderRadius: '40px',
                                backgroundColor: activeTab === 'home' ? 'var(--glass-active-bg)' : 'transparent',
                                color: activeTab === 'home' ? 'var(--glass-active-text)' : 'var(--glass-inactive-text)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontSize: '13px',
                                fontWeight: 500,
                            }}
                        >
                            <Home size={18} />
                            {activeTab === 'home' && <span>Home</span>}
                        </button>

                        {/* Settings Tab */}
                        <button
                            onClick={() => setActiveTab('settings')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: activeTab === 'settings' ? '10px 20px' : '10px 16px',
                                border: 'none',
                                borderRadius: '40px',
                                backgroundColor: activeTab === 'settings' ? 'var(--glass-active-bg)' : 'transparent',
                                color: activeTab === 'settings' ? 'var(--glass-active-text)' : 'var(--glass-inactive-text)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontSize: '13px',
                                fontWeight: 500,
                            }}
                        >
                            <Settings size={18} />
                            {activeTab === 'settings' && <span>Settings</span>}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnalysisPanel;
