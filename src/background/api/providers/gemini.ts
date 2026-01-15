import { RepositoryData, Analysis, AIProvider as AIProviderEnum } from '@shared/types';
import { API_ENDPOINTS } from '@shared/constants';
import { AIProvider, ChatContext, buildAnalysisPrompt, buildChatPrompt } from '../ai-provider';

/**
 * Gemini (Google) AI Provider
 */
export class GeminiProvider implements AIProvider {
    readonly name = 'Gemini';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'gemini-2.0-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async analyzeRepository(
        repoData: RepositoryData,
        onChunk: (chunk: string) => void
    ): Promise<Analysis> {
        const prompt = buildAnalysisPrompt(repoData);
        let fullContent = '';

        const url = `${API_ENDPOINTS.GEMINI_API}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 4096,
                    temperature: 0.7,
                },
            }),
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait 1-2 minutes and try again. (Gemini free tier has strict limits)');
            }
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid API key. Please check your Gemini API key in the extension settings.');
            }
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
        }

        // Handle streaming response
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

            // Gemini returns JSON array chunks
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        // Remove leading comma or bracket if present
                        const cleanLine = line.replace(/^[\[,]/, '').replace(/\]$/, '');
                        if (cleanLine.trim()) {
                            const data = JSON.parse(cleanLine);
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                fullContent += text;
                                onChunk(text);
                            }
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
            provider: AIProviderEnum.GEMINI,
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

        const url = `${API_ENDPOINTS.GEMINI_API}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7,
                },
            }),
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait 1-2 minutes and try again.');
            }
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid API key. Please check your Gemini API key in the extension settings.');
            }
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
        }

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
                if (line.trim()) {
                    try {
                        const cleanLine = line.replace(/^[\[,]/, '').replace(/\]$/, '');
                        if (cleanLine.trim()) {
                            const data = JSON.parse(cleanLine);
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                fullContent += text;
                                onChunk(text);
                            }
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
            const url = `${API_ENDPOINTS.GEMINI_API}/models/${this.model}:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hi' }] }],
                    generationConfig: { maxOutputTokens: 10 },
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
