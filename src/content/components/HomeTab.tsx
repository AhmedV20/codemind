import React, { useRef, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, Sparkles, AlertCircle, Settings, Package, Key, ChevronDown, Cpu, Check, Send, Loader2, RefreshCw, Clock } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import ThinkingBox from './ThinkingBox';
import AnalyzedFilesDropdown from './AnalyzedFilesDropdown';
import { parseThinkingContent } from '../utils/thinkingParser';
import { SUGGESTED_QUESTIONS } from '@shared/constants';

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
        chatMessages,
        chatStatus,
        chatStreamingContent,
        chatError,
        sendChatMessage,
        cooldownRemaining,
        setCooldownRemaining
    } = useAnalysisStore();

    const [chatInput, setChatInput] = useState('');
    const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    const displayContent = analysis?.content || streamingContent;
    const isLoading = status === 'loading';
    const isStreaming = status === 'streaming';
    const isIdle = status === 'idle';
    const needsApiKey = error === 'API_KEY_REQUIRED';
    const noProvidersConfigured = availableProviders.length === 0;
    // Show token modal for rate limit OR bad credentials (invalid/missing token)
    const isGitHubAuthError = error?.includes('rate limit') || error?.includes('Rate limit') ||
        error?.includes('Bad credentials') || error?.includes('401 Bad credentials');

    // Parse thinking content from AI output
    const parsedContent = useMemo(() => {
        if (!displayContent) return null;
        return parseThinkingContent(displayContent);
    }, [displayContent]);

    // Smooth auto-scroll during streaming using RAF and lerp
    useEffect(() => {
        if (!isStreaming || !contentRef.current) return;

        let animationFrameId: number;
        const container = contentRef.current;

        const smoothScroll = () => {
            if (!container) return;

            const targetScroll = container.scrollHeight - container.clientHeight;
            const currentScroll = container.scrollTop;
            const diff = targetScroll - currentScroll;

            // If close enough (within 1px), stop animating
            if (Math.abs(diff) < 1) {
                container.scrollTop = targetScroll;
                return;
            }

            // Lerp factor: 0.25 for faster, more responsive scrolling
            container.scrollTop = currentScroll + diff * 0.25;
            animationFrameId = requestAnimationFrame(smoothScroll);
        };

        // Start the animation loop
        animationFrameId = requestAnimationFrame(smoothScroll);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [streamingContent, isStreaming]);

    // Auto-scroll for chat messages and chat streaming
    useEffect(() => {
        if (contentRef.current && (chatMessages.length > 0 || chatStreamingContent)) {
            contentRef.current.scrollTo({
                top: contentRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [chatMessages, chatStreamingContent]);

    // Ensure final scroll when analysis streaming ends
    useEffect(() => {
        if (status === 'complete' && contentRef.current) {
            // Use timeout to ensure DOM has updated
            setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.scrollTop = contentRef.current.scrollHeight;
                }
            }, 100);
        }
    }, [status]);

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
    // Cooldown timer effect
    useEffect(() => {
        if (cooldownRemaining <= 0) return;

        const timer = setInterval(() => {
            const newRemaining = cooldownRemaining - 1000;
            if (newRemaining <= 0) {
                setCooldownRemaining(0);
                clearInterval(timer);
            } else {
                setCooldownRemaining(newRemaining);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldownRemaining, setCooldownRemaining]);

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
                    Supports Gemini, Claude, HuggingFace, and OpenRouter
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
                {/* Cooldown Timer or Analyze Button */}
                {cooldownRemaining > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        {/* Circular timer */}
                        <div style={{
                            position: 'relative',
                            width: '80px',
                            height: '80px',
                        }}>
                            <svg
                                width="80"
                                height="80"
                                style={{ transform: 'rotate(-90deg)' }}
                            >
                                {/* Background circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    fill="none"
                                    stroke="rgba(139, 92, 246, 0.15)"
                                    strokeWidth="6"
                                />
                                {/* Animated progress circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    fill="none"
                                    stroke="url(#cooldown-gradient)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 35}
                                    strokeDashoffset={2 * Math.PI * 35 * (1 - cooldownRemaining / 30000)}
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                                <defs>
                                    <linearGradient id="cooldown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            {/* Timer text */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}>
                                <Clock size={16} style={{ color: '#8b5cf6', marginBottom: '2px' }} />
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--gai-text-color)',
                                }}>
                                    {Math.ceil(cooldownRemaining / 1000)}s
                                </span>
                            </div>
                        </div>
                        <span style={{
                            fontSize: '13px',
                            color: 'var(--gai-text-muted)',
                        }}>
                            Cooldown active
                        </span>
                    </div>
                ) : (
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
                )}

                <p style={{
                    fontSize: '12px',
                    color: 'var(--gai-text-subtle)',
                    marginTop: '16px',
                    maxWidth: '260px',
                }}>
                    {cooldownRemaining > 0
                        ? 'Rate limiting protects API resources'
                        : 'Get AI-powered insights about this repository in seconds'}
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
                        background: isGitHubAuthError
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(248, 81, 73, 0.15) 0%, rgba(218, 54, 51, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                    }}>
                        <AlertCircle size={36} style={{ color: isGitHubAuthError ? '#a78bfa' : '#f85149' }} />
                    </div>

                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'var(--gai-text-color)',
                        marginBottom: '8px',
                    }}>
                        {isGitHubAuthError ? 'GitHub Rate Limit' : 'Something Went Wrong'}
                    </h2>

                    <p style={{
                        fontSize: '14px',
                        color: 'var(--gai-text-muted)',
                        marginBottom: '24px',
                        maxWidth: '300px',
                        lineHeight: 1.5,
                    }}>
                        {isGitHubAuthError
                            ? 'GitHub API rate limit reached. Please wait ~60 minutes and try again.'
                            : error}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
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

    // Analysis content with integrated chat
    const isChatLoading = chatStatus === 'loading';
    const suggestedQuestions = analysis?.sections?.downloadInfo?.hasReleases
        ? SUGGESTED_QUESTIONS.hasReleases
        : SUGGESTED_QUESTIONS.default;

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (chatInput.trim() && !isChatLoading) {
            sendChatMessage(chatInput.trim());
            setChatInput('');
        }
    };

    const handleSuggestedQuestion = (question: string) => {
        if (!isChatLoading) {
            sendChatMessage(question);
        }
    };

    return (
        <>
            <div ref={contentRef} style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Analysis Content */}
                {displayContent && parsedContent && (
                    <div className="gai-markdown">
                        {/* Show thinking box if AI returned thinking content */}
                        {parsedContent.hasThinking && parsedContent.thinking && (
                            <ThinkingBox
                                thinking={parsedContent.thinking}
                                isThinking={!parsedContent.isComplete}
                            />
                        )}

                        {/* Analyzed Files Dropdown - below thinking, above content */}
                        {analysis?.strategyResult?.files && analysis.strategyResult.files.length > 0 && (
                            <AnalyzedFilesDropdown files={analysis.strategyResult.files} />
                        )}

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedContent.content}</ReactMarkdown>
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

                {/* Integrated Chat Section - appears after analysis complete */}
                {status === 'complete' && (
                    <div style={{
                        marginTop: '24px',
                        paddingTop: '20px',
                        borderTop: '1px solid var(--gai-border-muted)',
                        animation: 'gai-fade-in 0.4s ease-out',
                    }}>
                        {/* Suggested Questions - show when no chat messages */}
                        {chatMessages.length === 0 && !chatStreamingContent && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--gai-text-muted)',
                                    marginBottom: '12px',
                                    fontWeight: 500,
                                }}>
                                    ✨ Ask a follow-up question
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {suggestedQuestions.slice(0, 4).map((question, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSuggestedQuestion(question)}
                                            disabled={isChatLoading}
                                            style={{
                                                padding: '10px 16px',
                                                fontSize: '13px',
                                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                                borderRadius: '20px',
                                                cursor: isChatLoading ? 'not-allowed' : 'pointer',
                                                color: 'var(--gai-text-color)',
                                                transition: 'all 0.2s ease',
                                                opacity: isChatLoading ? 0.5 : 1,
                                                fontWeight: 400,
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isChatLoading) {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)';
                                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)';
                                                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        {chatMessages.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                marginBottom: '16px',
                            }}>
                                {chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            maxWidth: '90%',
                                            background: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                                                : 'var(--gai-bg-secondary)',
                                            border: msg.role === 'assistant' ? '1px solid var(--gai-border-muted)' : 'none',
                                            color: msg.role === 'user' ? '#ffffff' : 'var(--gai-text-color)',
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            boxShadow: msg.role === 'user'
                                                ? '0 2px 8px rgba(139, 92, 246, 0.25)'
                                                : '0 1px 4px rgba(0, 0, 0, 0.05)',
                                        }}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <div className="gai-markdown" style={{ fontSize: '13px' }}>
                                                {(() => {
                                                    const parsed = parseThinkingContent(msg.content);
                                                    return (
                                                        <>
                                                            {parsed.hasThinking && parsed.thinking && (
                                                                <ThinkingBox
                                                                    thinking={parsed.thinking}
                                                                    isThinking={!parsed.isComplete}
                                                                />
                                                            )}
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.content}</ReactMarkdown>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '13px' }}>{msg.content}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Streaming Response */}
                        {chatStreamingContent && (
                            <div
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '18px 18px 18px 4px',
                                    maxWidth: '90%',
                                    background: 'var(--gai-bg-secondary)',
                                    border: '1px solid var(--gai-border-muted)',
                                    color: 'var(--gai-text-color)',
                                    alignSelf: 'flex-start',
                                    marginBottom: '16px',
                                }}
                            >
                                <div className="gai-markdown" style={{ fontSize: '13px' }}>
                                    {(() => {
                                        const parsed = parseThinkingContent(chatStreamingContent);
                                        return (
                                            <>
                                                {parsed.hasThinking && parsed.thinking && (
                                                    <ThinkingBox
                                                        thinking={parsed.thinking}
                                                        isThinking={!parsed.isComplete}
                                                    />
                                                )}
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.content}</ReactMarkdown>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Loading indicator */}
                        {isChatLoading && !chatStreamingContent && (
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '18px 18px 18px 4px',
                                maxWidth: '90%',
                                background: 'var(--gai-bg-secondary)',
                                border: '1px solid var(--gai-border-muted)',
                                alignSelf: 'flex-start',
                                marginBottom: '16px',
                            }}>
                                <ThinkingBox isLoading={true} />
                            </div>
                        )}

                        {/* Chat Error */}
                        {chatError && !isChatLoading && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                maxWidth: '90%',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                alignSelf: 'flex-start',
                                marginBottom: '16px',
                            }}>
                                <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#f87171', marginBottom: '4px' }}>
                                        Error
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--gai-text-muted)', lineHeight: 1.4 }}>
                                        {chatError}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const lastUserMsg = chatMessages.filter(m => m.role === 'user').pop();
                                            if (lastUserMsg) sendChatMessage(lastUserMsg.content);
                                        }}
                                        style={{
                                            marginTop: '8px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: 'var(--gai-text-muted)',
                                            backgroundColor: 'var(--gai-bg-tertiary)',
                                            border: '1px solid var(--gai-border-color)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <RefreshCw size={12} />
                                        Retry
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Auto-scroll anchor */}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Chat Input - Fixed at bottom when analysis complete */}
            {status === 'complete' && (
                <form
                    onSubmit={handleSendMessage}
                    style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '16px 20px',
                        borderTop: '1px solid var(--gai-border-muted)',
                        background: 'var(--gai-bg-secondary)',
                    }}
                >
                    <input
                        ref={chatInputRef}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        disabled={isChatLoading}
                        style={{
                            flex: 1,
                            padding: '12px 18px',
                            fontSize: '14px',
                            border: '2px solid var(--gai-border-color)',
                            borderRadius: '24px',
                            backgroundColor: 'var(--gai-bg-primary)',
                            color: 'var(--gai-text-color)',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--gai-border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '48px',
                            height: '48px',
                            border: 'none',
                            borderRadius: '50%',
                            background: chatInput.trim() && !isChatLoading
                                ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                                : 'var(--gai-bg-tertiary)',
                            color: chatInput.trim() && !isChatLoading ? '#ffffff' : 'var(--gai-text-muted)',
                            cursor: chatInput.trim() && !isChatLoading ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            boxShadow: chatInput.trim() && !isChatLoading
                                ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                                : 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (chatInput.trim() && !isChatLoading) {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            if (chatInput.trim() && !isChatLoading) {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                            }
                        }}
                    >
                        {isChatLoading ? <Loader2 size={20} className="gai-spinner" /> : <Send size={20} />}
                    </button>
                </form>
            )}

            <style>{`
                @keyframes gai-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                @keyframes gai-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};

export default HomeTab;
