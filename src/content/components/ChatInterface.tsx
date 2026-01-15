import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, X, Loader2 } from 'lucide-react';
import { useAnalysisStore } from '../hooks/useAnalysis';
import { SUGGESTED_QUESTIONS } from '@shared/constants';

interface ChatInterfaceProps {
    onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
    const {
        chatMessages,
        chatStatus,
        chatStreamingContent,
        sendChatMessage,
        analysis
    } = useAnalysisStore();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
                height: '300px',
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
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                            <ReactMarkdown>{chatStreamingContent}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && !chatStreamingContent && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            color: 'var(--gai-text-muted)',
                            fontSize: '13px',
                        }}
                    >
                        <Loader2 size={14} className="gai-spinner" />
                        Thinking...
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
        </div>
    );
};

export default ChatInterface;
