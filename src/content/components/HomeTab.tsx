import React, { useRef, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Sparkles, AlertCircle, Settings, MessageCircle, Package, Key, ChevronDown, Cpu, Check } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import ChatInterface from './ChatInterface';
import ThinkingBox from './ThinkingBox';
import GitHubTokenModal from './GitHubTokenModal';
import { parseThinkingContent } from '../utils/thinkingParser';

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
        setSelectedProvider,
        saveGitHubToken
    } = useAnalysisStore();

    const [showChat, setShowChat] = useState(false);
    const [showRateLimitModal, setShowRateLimitModal] = useState(false);
    const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const displayContent = analysis?.content || streamingContent;
    const isLoading = status === 'loading';
    const isStreaming = status === 'streaming';
    const isIdle = status === 'idle';
    const needsApiKey = error === 'API_KEY_REQUIRED';
    const noProvidersConfigured = availableProviders.length === 0;
    const isRateLimitError = error?.includes('rate limit') || error?.includes('Rate limit');

    // Parse thinking content from AI output
    const parsedContent = useMemo(() => {
        if (!displayContent) return null;
        return parseThinkingContent(displayContent);
    }, [displayContent]);

    // Auto-scroll during streaming
    useEffect(() => {
        if (isStreaming && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [streamingContent, isStreaming]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
                setProviderDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-show rate limit modal when error detected
    useEffect(() => {
        if (isRateLimitError) {
            setShowRateLimitModal(true);
        }
    }, [isRateLimitError]);

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
                flex: 1,
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
                flex: 1,
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

                {/* Provider selector - glass dropdown */}
                {showProviderSelector && (
                    <div ref={providerDropdownRef} style={{ position: 'relative', marginBottom: '20px' }}>
                        <button
                            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 16px',
                                backgroundColor: 'rgba(22, 22, 24, 0.8)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                minWidth: '160px',
                            }}
                        >
                            <Cpu size={14} style={{ color: '#8b5cf6' }} />
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#e4e4e7', textAlign: 'left' }}>
                                {availableProviders.find(p => p.provider === selectedProvider)?.name || 'Select'}
                            </span>
                            <ChevronDown size={14} style={{
                                color: 'rgba(228, 228, 231, 0.5)',
                                transform: providerDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                            }} />
                        </button>

                        {providerDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                minWidth: '180px',
                                backgroundColor: 'rgba(22, 22, 24, 0.98)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                                overflow: 'hidden',
                                zIndex: 100,
                            }}>
                                {availableProviders.map(p => (
                                    <button
                                        key={p.provider}
                                        onClick={() => {
                                            setSelectedProvider(p.provider);
                                            setProviderDropdownOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '10px',
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Cpu size={14} style={{ color: '#8b5cf6' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#e4e4e7' }}>{p.name}</span>
                                        </div>
                                        {p.provider === selectedProvider && <Check size={14} style={{ color: '#10b981' }} />}
                                    </button>
                                ))}
                            </div>
                        )}
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
                flex: 1,
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
            <>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 24px',
                    textAlign: 'center',
                    flex: 1,
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: isRateLimitError
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(248, 81, 73, 0.15) 0%, rgba(218, 54, 51, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                    }}>
                        <AlertCircle size={36} style={{ color: isRateLimitError ? '#a78bfa' : '#f85149' }} />
                    </div>

                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'var(--gai-text-color)',
                        marginBottom: '8px',
                    }}>
                        {isRateLimitError ? 'GitHub Rate Limit' : 'Something Went Wrong'}
                    </h2>

                    <p style={{
                        fontSize: '14px',
                        color: 'var(--gai-text-muted)',
                        marginBottom: '24px',
                        maxWidth: '300px',
                        lineHeight: 1.5,
                    }}>
                        {isRateLimitError
                            ? 'GitHub API rate limit exceeded. Add a token for 5,000 requests/hour or wait ~60 minutes.'
                            : error}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {isRateLimitError && (
                            <button
                                onClick={() => setShowRateLimitModal(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.45)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.35)';
                                }}
                            >
                                <Key size={16} />
                                Add GitHub Token
                            </button>
                        )}
                        <button
                            onClick={() => startAnalysis(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: isRateLimitError ? 'var(--gai-text-muted)' : '#fff',
                                background: isRateLimitError
                                    ? 'var(--gai-bg-tertiary)'
                                    : 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
                                border: isRateLimitError ? '1px solid var(--gai-border-color)' : 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isRateLimitError ? 'none' : '0 4px 14px rgba(248, 81, 73, 0.35)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <Sparkles size={16} />
                            Try Again
                        </button>
                    </div>
                </div>

                {/* GitHub Rate Limit Modal */}
                <GitHubTokenModal
                    isOpen={showRateLimitModal}
                    onClose={() => setShowRateLimitModal(false)}
                    onSaveToken={saveGitHubToken}
                    onRetry={() => startAnalysis(true)}
                />
            </>
        );
    }

    // Loading skeleton - Modern glass design
    if (isLoading && !displayContent) {
        return (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* ThinkingBox in loading state */}
                <ThinkingBox isLoading={true} />

                {/* Glass skeleton cards */}
                <div style={{
                    padding: '16px',
                    background: 'rgba(139, 92, 246, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                }}>
                    <div className="gai-skeleton-shimmer" style={{
                        height: '20px',
                        width: '45%',
                        borderRadius: '6px',
                        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(139, 92, 246, 0.08) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'gai-shimmer 1.5s infinite',
                        marginBottom: '12px',
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="gai-skeleton-shimmer" style={{
                            height: '14px',
                            width: '100%',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'gai-shimmer 1.5s infinite',
                        }} />
                        <div className="gai-skeleton-shimmer" style={{
                            height: '14px',
                            width: '85%',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'gai-shimmer 1.5s infinite',
                            animationDelay: '0.1s',
                        }} />
                        <div className="gai-skeleton-shimmer" style={{
                            height: '14px',
                            width: '92%',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'gai-shimmer 1.5s infinite',
                            animationDelay: '0.2s',
                        }} />
                    </div>
                </div>

                {/* Second glass card */}
                <div style={{
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                }}>
                    <div className="gai-skeleton-shimmer" style={{
                        height: '18px',
                        width: '35%',
                        borderRadius: '6px',
                        background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(59, 130, 246, 0.08) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'gai-shimmer 1.5s infinite',
                        marginBottom: '10px',
                    }} />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[70, 55, 80, 45].map((w, i) => (
                            <div key={i} className="gai-skeleton-shimmer" style={{
                                height: '28px',
                                width: `${w}px`,
                                borderRadius: '14px',
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'gai-shimmer 1.5s infinite',
                                animationDelay: `${i * 0.1}s`,
                            }} />
                        ))}
                    </div>
                </div>

                <style>{`
                    @keyframes gai-shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>
            </div>
        );
    }

    // Analysis content
    return (
        <>
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                {displayContent && parsedContent && (
                    <div className="gai-markdown">
                        {/* Show thinking box if AI returned thinking content */}
                        {parsedContent.hasThinking && parsedContent.thinking && (
                            <ThinkingBox thinking={parsedContent.thinking} />
                        )}
                        <ReactMarkdown>{parsedContent.content}</ReactMarkdown>
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

            {/* GitHub Rate Limit Modal */}
            <GitHubTokenModal
                isOpen={showRateLimitModal}
                onClose={() => setShowRateLimitModal(false)}
                onSaveToken={saveGitHubToken}
                onRetry={() => startAnalysis(true)}
            />

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
