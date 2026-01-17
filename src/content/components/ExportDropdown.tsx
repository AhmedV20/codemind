import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileType, ChevronDown, Loader2 } from 'lucide-react';
import { Analysis, RepositoryInfo } from '@shared/types';
import { exportAsMarkdown, exportAsPDF } from '../utils/exportUtils';

interface ExportDropdownProps {
    analysis: Analysis | null;
    repoInfo: RepositoryInfo | null;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ analysis, repoInfo }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportMarkdown = () => {
        if (!analysis || !repoInfo) return;

        setIsExporting(true);
        try {
            exportAsMarkdown(analysis, repoInfo);
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setIsOpen(false);
            }, 300);
        }
    };

    const handleExportPDF = async () => {
        if (!analysis || !repoInfo) return;

        setIsExporting(true);
        try {
            await exportAsPDF(analysis, repoInfo);
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setIsOpen(false);
            }, 300);
        }
    };

    const isDisabled = !analysis || !repoInfo || isExporting;

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            {/* Export Button */}
            <button
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                disabled={isDisabled}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: isDisabled ? 'var(--gai-text-muted)' : 'var(--gai-text-color)',
                    backgroundColor: 'var(--gai-bg-secondary)',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = 'var(--gai-bg-tertiary)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gai-bg-secondary)';
                }}
            >
                {isExporting ? (
                    <Loader2 size={14} className="gai-spinner" />
                ) : (
                    <Download size={14} />
                )}
                Export
                <ChevronDown size={12} style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    opacity: 0.6,
                }} />
            </button>

            {/* Dropdown Menu - Simple Dark Design */}
            {isOpen && !isExporting && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        minWidth: '200px',
                        backgroundColor: 'rgba(22, 22, 24, 0.98)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        overflow: 'hidden',
                        zIndex: 100,
                        animation: 'gai-dropdown-in 0.15s ease-out',
                    }}
                >
                    {/* Markdown Option */}
                    <button
                        onClick={handleExportMarkdown}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '14px 16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#e4e4e7',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        }}>
                            <FileText size={16} style={{ color: '#a78bfa' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '2px' }}>Markdown</div>
                            <div style={{
                                fontSize: '11px',
                                color: 'rgba(228, 228, 231, 0.5)',
                                fontWeight: 400
                            }}>
                                Plain text, editable format
                            </div>
                        </div>
                    </button>

                    {/* Divider */}
                    <div style={{
                        height: '1px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        margin: '0 12px',
                    }} />

                    {/* PDF Option */}
                    <button
                        onClick={handleExportPDF}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '14px 16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#e4e4e7',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        }}>
                            <FileType size={16} style={{ color: '#f87171' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '2px' }}>PDF Document</div>
                            <div style={{
                                fontSize: '11px',
                                color: 'rgba(228, 228, 231, 0.5)',
                                fontWeight: 400
                            }}>
                                Professional report format
                            </div>
                        </div>
                    </button>
                </div>
            )}

            <style>{`
                @keyframes gai-dropdown-in {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default ExportDropdown;
