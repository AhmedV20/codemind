import React, { useEffect } from 'react';
import { Brain, Loader2, CheckCircle } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';

const AnalyzeButton: React.FC = () => {
    const { status, hasCachedAnalysis, showPanel, checkCache, repoInfo } = useAnalysisStore();

    // Check cache when repo info changes
    useEffect(() => {
        if (repoInfo) {
            checkCache();
        }
    }, [repoInfo?.owner, repoInfo?.repo, repoInfo?.branch]);

    const isLoading = status === 'loading' || status === 'streaming';
    const hasAnalysis = status === 'complete' || hasCachedAnalysis;

    const handleClick = () => {
        showPanel();
    };

    const getButtonContent = () => {
        if (isLoading) {
            return (
                <>
                    <Loader2 className="gai-spinner" size={16} />
                    <span>Analyzing...</span>
                </>
            );
        }

        if (hasAnalysis) {
            return (
                <>
                    <CheckCircle size={16} />
                    <span>View Analysis</span>
                </>
            );
        }

        return (
            <>
                <Brain size={16} />
                <span>CodeMind</span>
            </>
        );
    };

    // Liquid Glass button styles
    const getButtonStyles = (): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            height: '32px',
            padding: '0 14px',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
            letterSpacing: '0.01em',
            lineHeight: '1',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '5px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
        };

        if (isLoading) {
            return {
                ...baseStyles,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
                boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                opacity: 0.85,
                cursor: 'wait',
            };
        }

        if (hasAnalysis) {
            return {
                ...baseStyles,
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.9) 100%)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
                boxShadow: '0 2px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            };
        }

        // Default: Glass purple
        return {
            ...baseStyles,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 50%, rgba(59, 130, 246, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            boxShadow: '0 2px 12px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        };
    };

    return (
        <button
            onClick={handleClick}
            className="gai-analyze-btn"
            aria-label={hasAnalysis ? "View Analysis" : "Open CodeMind"}
            title={hasAnalysis ? "View cached analysis" : "Open CodeMind - AI Repository Analyzer"}
            style={getButtonStyles()}
            onMouseEnter={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                    if (hasAnalysis) {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    } else {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                if (hasAnalysis) {
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                } else {
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }
            }}
        >
            {getButtonContent()}
        </button>
    );
};

export default AnalyzeButton;
