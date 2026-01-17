/**
 * Thinking Parser Utility
 * Parses AI output to extract <think>...</think> blocks
 */

export interface ParsedContent {
    thinking: string | null;
    content: string;
    hasThinking: boolean;
}

/**
 * Parse content for thinking blocks
 * Handles formats:
 * - <think>...</think>
 * - <thinking>...</thinking>
 */
export function parseThinkingContent(text: string): ParsedContent {
    if (!text) {
        return { thinking: null, content: '', hasThinking: false };
    }

    // Match <think>...</think> or <thinking>...</thinking>
    const thinkingRegex = /<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi;

    let thinking: string | null = null;
    const matches = text.match(thinkingRegex);

    if (matches && matches.length > 0) {
        // Extract all thinking content
        const thinkingParts: string[] = [];

        for (const match of matches) {
            const innerContent = match
                .replace(/<think(?:ing)?>/gi, '')
                .replace(/<\/think(?:ing)?>/gi, '')
                .trim();

            if (innerContent) {
                thinkingParts.push(innerContent);
            }
        }

        if (thinkingParts.length > 0) {
            thinking = thinkingParts.join('\n\n');
        }
    }

    // Remove thinking blocks from content
    const cleanContent = text
        .replace(thinkingRegex, '')
        .trim();

    return {
        thinking,
        content: cleanContent,
        hasThinking: thinking !== null && thinking.length > 0,
    };
}

/**
 * Check if content contains thinking blocks
 */
export function hasThinkingContent(text: string): boolean {
    if (!text) return false;
    return /<think(?:ing)?>/i.test(text);
}
