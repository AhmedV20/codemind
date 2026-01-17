import React from 'react';
import { createRoot } from 'react-dom/client';
import { Github, ExternalLink } from 'lucide-react';

const Popup: React.FC = () => {
    return (
        <div style={{
            width: '280px',
            padding: '10px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
            fontSize: '14px',
            background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
            color: '#e6edf3',
        }}>
            {/* Card with Glass Effect */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(139, 92, 246, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '14px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
                {/* Logo */}
                <img
                    src={chrome.runtime.getURL('icons/icon128.png')}
                    alt="CodeMind"
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                    }}
                />

                {/* Name + Description */}
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        CodeMind
                    </h1>
                    <p style={{
                        margin: '4px 0 0',
                        fontSize: '12px',
                        color: '#8d96a0',
                        lineHeight: 1.4,
                    }}>
                        AI-powered GitHub repository analyzer
                    </p>
                </div>
            </div>

            {/* GitHub Link */}
            <a
                href="https://github.com/AhmedV20/codemind"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#e6edf3',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
            >
                <Github size={16} />
                View on GitHub
                <ExternalLink size={12} style={{ opacity: 0.6 }} />
            </a>

            {/* Footer */}
            <div style={{
                marginTop: '16px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#484f58',
            }}>
                Made with ❤️ by AhmedV20
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
