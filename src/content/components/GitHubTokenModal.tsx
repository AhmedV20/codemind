import React, { useState, useEffect } from 'react';
import { X, Key, Clock, ExternalLink, AlertTriangle, Check, Loader2 } from 'lucide-react';

interface GitHubTokenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveToken: (token: string) => Promise<boolean>;
    onRetry: () => void;
}

/**
 * Modal for GitHub API rate limit - allows user to add token or wait
 */
const GitHubTokenModal: React.FC<GitHubTokenModalProps> = ({
    isOpen,
    onClose,
    onSaveToken,
    onRetry,
}) => {
    const [token, setToken] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [countdown, setCountdown] = useState(60 * 60); // 60 minutes in seconds

    // Countdown timer
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSave = async () => {
        if (!token.trim()) return;

        setSaving(true);
        try {
            await onSaveToken(token.trim());
            setSaved(true);
            setTimeout(() => {
                onRetry();
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to save token:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 10000,
                }}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '380px',
                    backgroundColor: 'rgba(22, 22, 24, 0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
                    zIndex: 10001,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <AlertTriangle size={18} style={{ color: '#f87171' }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e4e4e7' }}>
                                GitHub Rate Limit
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(228, 228, 231, 0.5)' }}>
                                API limit exceeded
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: 'rgba(228, 228, 231, 0.4)',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                    {/* Option 1: Add Token */}
                    <div
                        style={{
                            padding: '16px',
                            background: 'rgba(139, 92, 246, 0.08)',
                            borderRadius: '12px',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            marginBottom: '16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Key size={14} style={{ color: '#a78bfa' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>
                                Add GitHub Token
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(228, 228, 231, 0.6)', marginBottom: '12px', lineHeight: 1.5 }}>
                            A personal access token increases your rate limit to 5,000 requests/hour.
                        </p>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '13px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                color: '#e4e4e7',
                                outline: 'none',
                                boxSizing: 'border-box',
                                marginBottom: '12px',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleSave}
                                disabled={!token.trim() || saving}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '10px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#fff',
                                    background: saved
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: !token.trim() || saving ? 'not-allowed' : 'pointer',
                                    opacity: !token.trim() ? 0.5 : 1,
                                }}
                            >
                                {saving ? <Loader2 size={14} className="gai-spinner" /> : saved ? <Check size={14} /> : null}
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save & Retry'}
                            </button>
                        </div>
                        <a
                            href="https://github.com/settings/tokens?type=beta"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: '#a78bfa',
                                textDecoration: 'none',
                                marginTop: '10px',
                            }}
                        >
                            <ExternalLink size={10} />
                            Get a token from GitHub Settings
                        </a>
                    </div>

                    {/* Option 2: Wait */}
                    <div
                        style={{
                            padding: '16px',
                            background: 'rgba(59, 130, 246, 0.08)',
                            borderRadius: '12px',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Clock size={14} style={{ color: '#60a5fa' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa' }}>
                                Or Wait for Reset
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(228, 228, 231, 0.6)', marginBottom: '12px', lineHeight: 1.5 }}>
                            <strong style={{ color: '#e4e4e7' }}>Rate limit resets in approximately:</strong>
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '8px',
                                marginBottom: '12px',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                    color: countdown === 0 ? '#10b981' : '#60a5fa',
                                }}
                            >
                                {countdown === 0 ? 'Ready!' : formatTime(countdown)}
                            </span>
                        </div>
                        {countdown === 0 && (
                            <button
                                onClick={() => {
                                    onRetry();
                                    onClose();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default GitHubTokenModal;
