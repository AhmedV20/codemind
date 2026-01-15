import React from 'react';
import { createRoot } from 'react-dom/client';
import { Github, Twitter, ExternalLink, Heart } from 'lucide-react';

const Popup: React.FC = () => {
    return (
        <div style={{
            width: '280px',
            padding: '0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
            fontSize: '14px',
            backgroundColor: '#0d1117',
            color: '#e6edf3',
            overflow: 'hidden',
        }}>
            {/* Header with gradient */}
            <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                padding: '24px 20px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Subtle pattern overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%)',
                }} />

                {/* Logo */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <img
                        src={chrome.runtime.getURL('icons/icon128.png')}
                        alt="CodeMind"
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            marginBottom: '12px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                        }}
                    />
                    <h1 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '-0.02em',
                    }}>
                        CodeMind
                    </h1>
                    <p style={{
                        margin: '6px 0 0',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 400,
                    }}>
                        AI Repository Analyzer
                    </p>
                </div>
            </div>

            {/* Description */}
            <div style={{
                padding: '16px 20px',
                textAlign: 'center',
                borderBottom: '1px solid #21262d',
            }}>
                <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#8b949e',
                    lineHeight: 1.5,
                }}>
                    Understand any GitHub repository instantly with AI-powered analysis.
                </p>
            </div>

            {/* Quick Links */}
            <div style={{
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
            }}>
                <a
                    href="https://github.com/AhmedV20/codemind"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        color: '#e6edf3',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'background-color 0.2s',
                        backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#21262d';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <Github size={18} style={{ color: '#8b949e' }} />
                    <span>View on GitHub</span>
                    <ExternalLink size={14} style={{ marginLeft: 'auto', color: '#8b949e' }} />
                </a>

                <a
                    href="https://twitter.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        color: '#e6edf3',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'background-color 0.2s',
                        backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#21262d';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <Twitter size={18} style={{ color: '#1d9bf0' }} />
                    <span>Follow on X</span>
                    <ExternalLink size={14} style={{ marginLeft: 'auto', color: '#8b949e' }} />
                </a>
            </div>

            {/* Footer */}
            <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #21262d',
                textAlign: 'center',
                backgroundColor: '#010409',
            }}>
                <p style={{
                    margin: 0,
                    fontSize: '11px',
                    color: '#6e7681',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                }}>
                    Made with <Heart size={12} style={{ color: '#f85149' }} /> by Ahmed
                </p>
                <p style={{
                    margin: '4px 0 0',
                    fontSize: '11px',
                    color: '#484f58',
                }}>
                    v1.0.0
                </p>
            </div>
        </div>
    );
};

// Mount app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<Popup />);
}

export default Popup;
