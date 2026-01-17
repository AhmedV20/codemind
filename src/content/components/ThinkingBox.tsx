import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface ThinkingBoxProps {
    thinking?: string;
    isLoading?: boolean;
    defaultExpanded?: boolean;
}

/**
 * ThinkingBox Component
 * Displays AI thinking/reasoning in a collapsible glass box
 * Can show either actual thinking content or a loading state
 */
const ThinkingBox: React.FC<ThinkingBoxProps> = ({
    thinking,
    isLoading = false,
    defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // If no thinking and not loading, render nothing
    if (!thinking && !isLoading) return null;

    return (
        <div style={{
            marginBottom: '16px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            background: 'rgba(139, 92, 246, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
        }}>
            {/* Header - Always visible */}
            <button
                onClick={() => !isLoading && setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: isLoading ? 'default' : 'pointer',
                    color: 'var(--gai-text-color)',
                    textAlign: 'left',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {isLoading ? (
                        <Loader2 size={14} style={{ color: '#a78bfa' }} className="gai-spinner" />
                    ) : (
                        <Brain size={14} style={{ color: '#a78bfa' }} />
                    )}
                </div>

                {/* Label */}
                <span style={{
                    flex: 1,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#a78bfa',
                }}>
                    {isLoading ? 'Thinking...' : 'Reasoning'}
                </span>

                {/* Expand/Collapse Icon - only show if not loading and has content */}
                {!isLoading && thinking && (
                    <div style={{
                        color: 'var(--gai-text-muted)',
                        transition: 'transform 0.2s ease',
                    }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                )}

                {/* Loading pulse dots */}
                {isLoading && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#a78bfa',
                                    animation: `gai-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                                }}
                            />
                        ))}
                    </div>
                )}
            </button>

            {/* Content - Collapsible (only when not loading and expanded) */}
            {!isLoading && isExpanded && thinking && (
                <div style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid rgba(139, 92, 246, 0.1)',
                }}>
                    <div style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        lineHeight: 1.6,
                        color: 'var(--gai-text-muted)',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '8px',
                    }}>
                        {thinking}
                    </div>
                </div>
            )}

            {/* Pulse animation keyframes */}
            <style>{`
                @keyframes gai-pulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ThinkingBox;
