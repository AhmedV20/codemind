import { RepositoryData, Analysis, AIProvider as AIProviderEnum } from '@shared/types';
import { API_ENDPOINTS } from '@shared/constants';
import { AIProvider, ChatContext, buildAnalysisPrompt, buildChatPrompt } from '../ai-provider';

/**
 * Claude (Anthropic) AI Provider
 */
export class ClaudeProvider implements AIProvider {
    readonly name = 'Claude';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'claude-sonnet-4-20250514') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async analyzeRepository(
        repoData: RepositoryData,
        onChunk: (chunk: string) => void
    ): Promise<Analysis> {
        const prompt = buildAnalysisPrompt(repoData);
        let fullContent = '';

        const response = await fetch(`${API_ENDPOINTS.CLAUDE_API}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 4096,
                stream: true,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || `Claude API error: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'content_block_delta' && data.delta?.text) {
                            fullContent += data.delta.text;
                            onChunk(data.delta.text);
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
            provider: AIProviderEnum.CLAUDE,
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

        const response = await fetch(`${API_ENDPOINTS.CLAUDE_API}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 2048,
                stream: true,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || `Claude API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'content_block_delta' && data.delta?.text) {
                            fullContent += data.delta.text;
                            onChunk(data.delta.text);
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        return fullContent;
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${API_ENDPOINTS.CLAUDE_API}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    private parseSections(content: string): Analysis['sections'] {
        // Basic parsing - in production, use more robust parsing
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
