import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import { SUGGESTED_QUESTIONS } from '@shared/constants';
import ThinkingBox from './ThinkingBox';
import GitHubTokenModal from './GitHubTokenModal';
import { parseThinkingContent } from '../utils/thinkingParser';

interface ChatInterfaceProps {
    onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
    const {
        chatMessages,
        chatStatus,
        chatStreamingContent,
        chatError,
        sendChatMessage,
        analysis,
        saveGitHubToken,
        startAnalysis
    } = useAnalysisStore();

    const [input, setInput] = useState('');
    const [showRateLimitModal, setShowRateLimitModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Detect rate limit error and show modal
    const isGitHubAuthError = chatError?.includes('rate limit') || chatError?.includes('Rate limit');

    useEffect(() => {
        if (isGitHubAuthError) {
            setShowRateLimitModal(true);
        }
    }, [isGitHubAuthError]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, chatStreamingContent]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && chatStatus !== 'loading') {
            sendChatMessage(input.trim());
            setInput('');
        }
    };

    const handleSuggestedQuestion = (question: string) => {
        if (chatStatus !== 'loading') {
            sendChatMessage(question);
        }
    };

    // Determine which suggested questions to show
    const suggestedQuestions = analysis?.sections?.downloadInfo?.hasReleases
        ? SUGGESTED_QUESTIONS.hasReleases
        : SUGGESTED_QUESTIONS.default;

    const isLoading = chatStatus === 'loading';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '450px',
                maxHeight: '50vh',
            }}
        >
            {/* Chat header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--gai-border-muted)',
                }}
            >
                <span style={{ fontSize: '13px', fontWeight: 500 }}>💬 Ask Questions</span>
                <button
                    onClick={onClose}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--gai-text-muted)',
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                {/* Show suggested questions if no messages yet */}
                {chatMessages.length === 0 && !chatStreamingContent && (
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--gai-text-muted)', marginBottom: '8px' }}>
                            Suggested questions:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {suggestedQuestions.slice(0, 4).map((question, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestedQuestion(question)}
                                    disabled={isLoading}
                                    style={{
                                        padding: '6px 10px',
                                        fontSize: '12px',
                                        backgroundColor: 'var(--gai-bg-primary)',
                                        border: '1px solid var(--gai-border-color)',
                                        borderRadius: '16px',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        color: 'var(--gai-text-color)',
                                        transition: 'background-color 0.2s',
                                    }}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat messages */}
                {chatMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`gai-chat-message gai-chat-message-${msg.role}`}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            maxWidth: '85%',
                            backgroundColor: msg.role === 'user'
                                ? 'var(--gai-accent-color)'
                                : 'var(--gai-bg-primary)',
                            color: msg.role === 'user' ? '#ffffff' : 'var(--gai-text-color)',
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                        }}
                    >
                        {msg.role === 'assistant' ? (
                            <div className="gai-markdown" style={{ fontSize: '13px' }}>
                                {(() => {
                                    const parsed = parseThinkingContent(msg.content);
                                    return (
                                        <>
                                            {parsed.hasThinking && parsed.thinking && (
                                                <ThinkingBox thinking={parsed.thinking} />
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

                {/* Streaming response */}
                {chatStreamingContent && (
                    <div
                        className="gai-chat-message gai-chat-message-assistant"
                        style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            maxWidth: '85%',
                            backgroundColor: 'var(--gai-bg-primary)',
                            color: 'var(--gai-text-color)',
                            alignSelf: 'flex-start',
                            borderBottomLeftRadius: '4px',
                        }}
                    >
                        <div className="gai-markdown" style={{ fontSize: '13px' }}>
                            {(() => {
                                const parsed = parseThinkingContent(chatStreamingContent);
                                return (
                                    <>
                                        {parsed.hasThinking && parsed.thinking && (
                                            <ThinkingBox thinking={parsed.thinking} />
                                        )}
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.content}</ReactMarkdown>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Loading indicator - uses ThinkingBox in message bubble */}
                {isLoading && !chatStreamingContent && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        maxWidth: '85%',
                        backgroundColor: 'var(--gai-bg-primary)',
                        alignSelf: 'flex-start',
                        borderBottomLeftRadius: '4px',
                    }}>
                        <ThinkingBox isLoading={true} />
                    </div>
                )}

                {/* Error display */}
                {chatError && !isLoading && (
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
                    }}>
                        <AlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f87171', marginBottom: '4px' }}>
                                Error
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gai-text-muted)', lineHeight: 1.4 }}>
                                {chatError}
                            </div>
                            {isGitHubAuthError && (
                                <button
                                    onClick={() => setShowRateLimitModal(true)}
                                    style={{
                                        marginTop: '8px',
                                        padding: '6px 12px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#a78bfa',
                                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Add GitHub Token
                                </button>
                            )}
                            {!isGitHubAuthError && (
                                <button
                                    onClick={() => sendChatMessage(chatMessages[chatMessages.length - 1]?.content || '')}
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
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '12px',
                    borderTop: '1px solid var(--gai-border-muted)',
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: '1px solid var(--gai-border-color)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--gai-bg-primary)',
                        color: 'var(--gai-text-color)',
                        outline: 'none',
                    }}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: input.trim() && !isLoading
                            ? 'var(--gai-accent-color)'
                            : 'var(--gai-bg-tertiary)',
                        color: input.trim() && !isLoading ? '#ffffff' : 'var(--gai-text-muted)',
                        cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    }}
                >
                    <Send size={16} />
                </button>
            </form>

            {/* GitHub Rate Limit Modal */}
            <GitHubTokenModal
                isOpen={showRateLimitModal}
                onClose={() => setShowRateLimitModal(false)}
                onSaveToken={saveGitHubToken}
                onRetry={() => {
                    const lastUserMsg = chatMessages.filter(m => m.role === 'user').pop();
                    if (lastUserMsg) sendChatMessage(lastUserMsg.content);
                }}
            />
        </div>
    );
};

export default ChatInterface;
