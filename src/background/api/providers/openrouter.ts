import { RepositoryData, Analysis, AIProvider as AIProviderEnum } from '@shared/types';
import { API_ENDPOINTS } from '@shared/constants';
import { AIProvider, ChatContext, buildAnalysisPrompt, buildChatPrompt } from '../ai-provider';

/**
 * OpenRouter AI Provider
 * Uses OpenAI-compatible API format
 */
export class OpenRouterProvider implements AIProvider {
    readonly name = 'OpenRouter';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'google/gemini-2.0-flash-exp:free') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async analyzeRepository(
        repoData: RepositoryData,
        onChunk: (chunk: string) => void
    ): Promise<Analysis> {
        const prompt = buildAnalysisPrompt(repoData);
        let fullContent = '';

        const url = `${API_ENDPOINTS.OPENROUTER_API}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com',
                'X-Title': 'CodeMind',
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 4096,
                temperature: 0.7,
                stream: true,
            }),
        });

        if (!response.ok) {
            const status = response.status;
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));

            if (status === 401 || status === 403) {
                throw new Error('Invalid API key. Please check your OpenRouter API key in the extension settings.');
            }
            if (status === 429) {
                throw new Error('Rate limit exceeded. Please wait and try again.');
            }
            if (status === 400) {
                throw new Error(`Invalid request: ${error.error?.message || 'Please check your model name.'}`);
            }

            throw new Error(error.error?.message || `OpenRouter API error: ${status}`);
        }

        // Handle SSE streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const dataStr = line.slice(5).trim();
                    if (dataStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            onChunk(content);
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        return {
            repoInfo: repoData.info,
            content: fullContent,
            sections: this.parseSections(fullContent),
            generatedAt: new Date().toISOString(),
            provider: AIProviderEnum.OPENROUTER,
            fromCache: false,
        };
    }

    async chat(
        question: string,
        context: ChatContext,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const prompt = buildChatPrompt(question, context);
        let fullContent = '';

        const url = `${API_ENDPOINTS.OPENROUTER_API}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com',
                'X-Title': 'CodeMind',
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 2048,
                temperature: 0.7,
                stream: false,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        fullContent = data.choices?.[0]?.message?.content || '';

        onChunk(fullContent);
        return fullContent;
    }

    async testConnection(): Promise<boolean> {
        try {
            const url = `${API_ENDPOINTS.OPENROUTER_API}/chat/completions`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com',
                    'X-Title': 'CodeMind',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10,
                }),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    private parseSections(content: string): Analysis['sections'] {
        return {
            summary: this.extractSection(content, '## 📊 Quick Summary'),
            whatItDoes: this.extractSection(content, '## 🎯 What It Does'),
            whoItsFor: this.extractSection(content, '## 👥 Who It\'s For'),
            keyFeatures: this.extractListItems(content, '## ✨ Key Features'),
            techStack: [],
            gettingStarted: this.extractSection(content, '## 🚀 Getting Started'),
            downloadInfo: content.includes('## 📥') ? { hasReleases: true } : undefined,
        };
    }

    private extractSection(content: string, header: string): string {
        const index = content.indexOf(header);
        if (index === -1) return '';
        const start = index + header.length;
        const nextSection = content.indexOf('## ', start);
        return content.slice(start, nextSection === -1 ? undefined : nextSection).trim();
    }

    private extractListItems(content: string, header: string): string[] {
        const section = this.extractSection(content, header);
        return section
            .split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
            .map(line => line.replace(/^[-*]\s*/, '').trim());
    }
}
