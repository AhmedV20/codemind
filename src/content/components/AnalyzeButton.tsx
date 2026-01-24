import React, { useEffect, useState } from 'react';
import { Brain, Loader2, CheckCircle } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';

const AnalyzeButton: React.FC = () => {
    const { status, hasCachedAnalysis, showPanel, checkCache, repoInfo } = useAnalysisStore();
    const [isHovered, setIsHovered] = useState(false);

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

    // Get status-based colors
    const getColors = () => {
        if (isLoading) {
            return {
                bg: '#3b82f6', // Blue
                hoverBg: '#2563eb',
                shadow: 'rgba(59, 130, 246, 0.3)',
            };
        }
        if (hasAnalysis) {
            return {
                bg: '#10b981', // Green
                hoverBg: '#059669',
                shadow: 'rgba(16, 185, 129, 0.3)',
            };
        }
        return {
            bg: '#8b5cf6', // Purple
            hoverBg: '#7c3aed',
            shadow: 'rgba(139, 92, 246, 0.3)',
        };
    };

    const colors = getColors();

    // Get button text based on state
    const getButtonText = () => {
        if (isLoading) return 'Analyzing...';
        if (hasAnalysis) return 'View Analysis';
        return 'CodeMind';
    };

    // Get icon based on state
    const getIcon = () => {
        if (isLoading) {
            return <Loader2 className="gai-btn-icon-svg gai-spinner" size={18} />;
        }
        if (hasAnalysis) {
            return <CheckCircle className="gai-btn-icon-svg" size={18} />;
        }
        return <Brain className="gai-btn-icon-svg" size={18} />;
    };

    const buttonStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '36px',
        padding: '0',
        paddingLeft: '9px',
        paddingRight: isHovered ? '14px' : '9px',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
        letterSpacing: '0.01em',
        lineHeight: '1',
        whiteSpace: 'nowrap',
        cursor: isLoading ? 'wait' : 'pointer',
        border: 'none',
        borderRadius: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        background: isHovered ? colors.hoverBg : colors.bg,
        color: '#ffffff',
        boxShadow: isHovered
            ? `0 4px 12px ${colors.shadow}`
            : `0 2px 8px ${colors.shadow}`,
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    };

    const iconContainerStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '18px',
        height: '18px',
        flexShrink: 0,
    };

    const textStyles: React.CSSProperties = {
        display: 'inline-block',
        overflow: 'hidden',
        maxWidth: isHovered ? '100px' : '0px',
        opacity: isHovered ? 1 : 0,
        marginLeft: isHovered ? '8px' : '0px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        whiteSpace: 'nowrap',
    };

    return (
        <button
            onClick={handleClick}
            className="gai-analyze-btn"
            aria-label={hasAnalysis ? "View Analysis" : "Open CodeMind"}
            title={hasAnalysis ? "View cached analysis" : "Open CodeMind - AI Repository Analyzer"}
            style={buttonStyles}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span style={iconContainerStyles}>
                {getIcon()}
            </span>
            <span style={textStyles}>
                {getButtonText()}
            </span>
        </button>
    );
};

export default AnalyzeButton;
