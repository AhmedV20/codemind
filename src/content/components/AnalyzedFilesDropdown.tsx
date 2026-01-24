import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, Code, BookOpen, FolderOpen } from 'lucide-react';

interface AnalyzedFilesDropdownProps {
    files: Array<{ path: string; type: string }>;
}

const AnalyzedFilesDropdown: React.FC<AnalyzedFilesDropdownProps> = ({ files }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showGlow, setShowGlow] = useState(true);

    // Remove glow after first interaction or after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowGlow(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        setShowGlow(false);
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'config':
                return <FileText size={14} style={{ color: '#f59e0b' }} />;
            case 'source':
                return <Code size={14} style={{ color: '#8b5cf6' }} />;
            case 'docs':
                return <BookOpen size={14} style={{ color: '#3b82f6' }} />;
            default:
                return <FileText size={14} style={{ color: 'var(--gai-text-muted)' }} />;
        }
    };

    const getFileName = (path: string) => {
        const parts = path.split('/');
        return parts.length > 1
            ? `${parts.slice(0, -1).join('/')}/${parts[parts.length - 1]}`
            : path;
    };

    if (!files || files.length === 0) return null;

    return (
        <div
            style={{
                marginBottom: '16px',
                borderRadius: '12px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                boxShadow: showGlow
                    ? '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1), var(--glass-shadow)'
                    : 'var(--glass-shadow)',
                overflow: 'hidden',
                transition: 'box-shadow 0.5s ease',
                animation: showGlow ? 'gai-glow-pulse 2s ease-in-out infinite' : 'none',
            }}
        >
            {/* Header */}
            <button
                onClick={handleToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gai-text-color)',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FolderOpen size={16} style={{ color: '#8b5cf6' }} />
                    <span>
                        <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{files.length}</span>
                        {' '}files analyzed
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp size={16} style={{ color: 'var(--gai-text-muted)' }} />
                ) : (
                    <ChevronDown size={16} style={{ color: 'var(--gai-text-muted)' }} />
                )}
            </button>

            {/* File List */}
            {isOpen && (
                <div
                    style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        borderTop: '1px solid var(--glass-border)',
                        padding: '8px 0',
                    }}
                >
                    {files.map((file, index) => (
                        <div
                            key={file.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                color: 'var(--gai-text-muted)',
                                animation: `gai-fade-slide-in 0.2s ease-out ${index * 0.03}s both`,
                            }}
                        >
                            {getFileIcon(file.type)}
                            <span style={{
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {getFileName(file.path)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Keyframe animations */}
            <style>{`
                @keyframes gai-glow-pulse {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1), var(--glass-shadow);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2), var(--glass-shadow);
                    }
                }
                @keyframes gai-fade-slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default AnalyzedFilesDropdown;
