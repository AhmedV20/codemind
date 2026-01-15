import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Sparkles, AlertCircle, Settings, MessageCircle, Package, Key, ChevronDown } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import ChatInterface from './ChatInterface';

const HomeTab: React.FC = () => {
    const {
        status,
        analysis,
        streamingContent,
        error,
        repoInfo,
        hasApiKey,
        availableProviders,
        settings,
        startAnalysis,
        setActiveTab,
        setSelectedProvider
    } = useAnalysisStore();

    const [showChat, setShowChat] = React.useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const displayContent = analysis?.content || streamingContent;
    const isLoading = status === 'loading';
    const isStreaming = status === 'streaming';
    const isIdle = status === 'idle';
    const needsApiKey = error === 'API_KEY_REQUIRED';
    const noProvidersConfigured = availableProviders.length === 0;

    // Auto-scroll during streaming
    useEffect(() => {
        if (isStreaming && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [streamingContent, isStreaming]);

    // No API keys configured - first time setup
    if (isIdle && !displayContent && noProvidersConfigured) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
                minHeight: '300px',
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: 'var(--glass-shadow), inset 0 0 0 1px var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                }}>
                    <Key size={36} style={{ color: '#8b5cf6' }} />
                </div>

                <h2 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--gai-text-color)',
                    marginBottom: '8px',
                }}>
                    Welcome to CodeMind
                </h2>

                <p style={{
                    fontSize: '14px',
                    color: 'var(--gai-text-muted)',
                    marginBottom: '24px',
                    maxWidth: '280px',
                    lineHeight: 1.5,
                }}>
                    Add an API key to get started with AI-powered repository analysis
                </p>

                <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 28px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#fff',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.95) 50%, rgba(59, 130, 246, 0.95) 100%)',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                >
                    <Settings size={16} />
                    Configure API Key
                </button>

                <p style={{
                    fontSize: '12px',
                    color: 'var(--gai-text-subtle)',
                    marginTop: '20px',
                    maxWidth: '260px',
                }}>
                    Supports Gemini, Claude, and HuggingFace
                </p>
            </div>
        );
    }

    // Welcome state - has API keys, ready to analyze
    if (isIdle && !displayContent) {
        const selectedProvider = settings?.ai.selectedProvider;
        const showProviderSelector = availableProviders.length > 1;

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
                minHeight: '300px',
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: 'var(--glass-shadow), inset 0 0 0 1px var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                }}>
                    <Brain size={36} style={{ color: '#8b5cf6' }} />
                </div>

                <h2 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--gai-text-color)',
                    marginBottom: '8px',
                }}>
                    Ready to Analyze
                </h2>

                {repoInfo && (
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--gai-text-muted)',
                        marginBottom: '20px',
                    }}>
                        {repoInfo.owner}/{repoInfo.repo}
                    </p>
                )}

                {/* Provider selector - only show if 2+ providers have API keys */}
                {showProviderSelector && (
                    <div style={{
                        position: 'relative',
                        marginBottom: '20px',
                        width: '180px',
                    }}>
                        <select
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 40px 12px 16px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--gai-text-color)',
                                backgroundColor: 'var(--glass-bg)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                appearance: 'none',
                                outline: 'none',
                                boxShadow: 'var(--glass-shadow)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {availableProviders.map(p => (
                                <option key={p.provider} value={p.provider}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--gai-text-muted)',
                                pointerEvents: 'none',
                            }}
                        />
                    </div>
                )}

                <button
                    onClick={() => startAnalysis()}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 28px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#fff',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.95) 50%, rgba(59, 130, 246, 0.95) 100%)',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                >
                    <Sparkles size={16} />
                    Analyze Repository
                </button>

                <p style={{
                    fontSize: '12px',
                    color: 'var(--gai-text-subtle)',
                    marginTop: '16px',
                    maxWidth: '260px',
                }}>
                    Get AI-powered insights about this repository in seconds
                </p>
            </div>
        );
    }

    // API Key required state (when trying to analyze without key for selected provider)
    if (needsApiKey) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
                minHeight: '300px',
            }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                }}>
                    <AlertCircle size={36} style={{ color: '#f59e0b' }} />
                </div>

                <h2 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--gai-text-color)',
                    marginBottom: '8px',
                }}>
                    API Key Required
                </h2>

                <p style={{
                    fontSize: '14px',
                    color: 'var(--gai-text-muted)',
                    marginBottom: '24px',
                    maxWidth: '280px',
                }}>
                    Please add your API key in Settings to start analyzing repositories
                </p>

                <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#fff',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <Settings size={16} />
                    Go to Settings
                </button>
            </div>
        );
    }

    // Error state (other errors)
    if (status === 'error' && error && error !== 'API_KEY_REQUIRED') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
                minHeight: '300px',
            }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(248, 81, 73, 0.15) 0%, rgba(218, 54, 51, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                }}>
                    <AlertCircle size={36} style={{ color: '#f85149' }} />
                </div>

                <h2 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--gai-text-color)',
                    marginBottom: '8px',
                }}>
                    Something Went Wrong
                </h2>

                <p style={{
                    fontSize: '14px',
                    color: 'var(--gai-text-muted)',
                    marginBottom: '24px',
                    maxWidth: '300px',
                    lineHeight: 1.5,
                }}>
                    {error}
                </p>

                <button
                    onClick={() => startAnalysis(true)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#fff',
                        background: 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 14px rgba(248, 81, 73, 0.35)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(248, 81, 73, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(248, 81, 73, 0.35)';
                    }}
                >
                    <Sparkles size={16} />
                    Try Again
                </button>
            </div>
        );
    }

    // Loading skeleton
    if (isLoading && !displayContent) {
        return (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="gai-skeleton" style={{ height: '24px', width: '60%', borderRadius: '6px' }} />
                <div className="gai-skeleton" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
                <div className="gai-skeleton" style={{ height: '16px', width: '90%', borderRadius: '4px' }} />
                <div className="gai-skeleton" style={{ height: '16px', width: '95%', borderRadius: '4px' }} />
                <div className="gai-skeleton" style={{ height: '24px', width: '50%', marginTop: '12px', borderRadius: '6px' }} />
                <div className="gai-skeleton" style={{ height: '16px', width: '85%', borderRadius: '4px' }} />
            </div>
        );
    }

    // Analysis content
    return (
        <>
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                {displayContent && (
                    <div className="gai-markdown">
                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                        {isStreaming && (
                            <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '16px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                marginLeft: '2px',
                                borderRadius: '2px',
                                animation: 'gai-blink 1s infinite',
                            }} />
                        )}
                        {/* Auto-scroll anchor */}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* Cache indicator */}
                {analysis?.fromCache && (
                    <div
                        style={{
                            marginTop: '16px',
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: 'var(--gai-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                        }}
                    >
                        <Package size={14} style={{ color: '#8b5cf6' }} />
                        Loaded from cache • {new Date(analysis.generatedAt).toLocaleString()}
                    </div>
                )}
            </div>

            {/* Chat section */}
            <div style={{ borderTop: '1px solid var(--gai-border-color)', backgroundColor: 'var(--gai-bg-secondary)' }}>
                {!showChat ? (
                    <button
                        onClick={() => setShowChat(true)}
                        disabled={status !== 'complete'}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: status === 'complete' ? '#8b5cf6' : 'var(--gai-text-muted)',
                            cursor: status === 'complete' ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (status === 'complete') {
                                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <MessageCircle size={16} />
                        Ask a question about this repository
                    </button>
                ) : (
                    <ChatInterface onClose={() => setShowChat(false)} />
                )}
            </div>

            <style>{`
                @keyframes gai-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `}</style>
        </>
    );
};

export default HomeTab;
