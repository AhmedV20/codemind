/**
 * Thinking Parser Utility
 * Parses AI output to extract <think>...</think> blocks
 */

export interface ParsedContent {
    thinking: string | null;
    content: string;
    hasThinking: boolean;
    isComplete: boolean;
}

/**
 * Parse content for thinking blocks
 * Handles formats:
 * - <think>...</think> (Completed)
 * - <thinking>...</thinking> (Completed)
 * - <think>... (Streaming/Incomplete)
 */
export function parseThinkingContent(text: string): ParsedContent {
    if (!text) {
        return { thinking: null, content: '', hasThinking: false, isComplete: true };
    }

    // 1. Check for complete thinking blocks first
    const completeThinkingRegex = /<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi;
    const completeMatches = text.match(completeThinkingRegex);

    if (completeMatches && completeMatches.length > 0) {
        let thinking = '';
        const thinkingParts: string[] = [];

        for (const match of completeMatches) {
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

        const cleanContent = text.replace(completeThinkingRegex, '').trim();

        return {
            thinking: thinking || null,
            content: cleanContent,
            hasThinking: thinkingParts.length > 0,
            isComplete: true
        };
    }

    // 2. Check for incomplete/streaming thinking block
    // Matches <think> or <thinking> followed by anything until end of string (since we checked for closing tags above)
    const incompleteThinkingRegex = /<think(?:ing)?>([\s\S]*)$/i;
    const incompleteMatch = text.match(incompleteThinkingRegex);

    if (incompleteMatch) {
        const rawThinking = incompleteMatch[1].trim(); // Content after the opening tag
        const cleanContent = text.replace(incompleteThinkingRegex, '').trim();

        return {
            thinking: rawThinking || null,
            content: cleanContent,
            hasThinking: true,
            isComplete: false // Still streaming/thinking
        };
    }

    // 3. No thinking tags found
    return {
        thinking: null,
        content: text,
        hasThinking: false,
        isComplete: true
    };
}

/**
 * Check if content contains thinking blocks
 */
export function hasThinkingContent(text: string): boolean {
    if (!text) return false;
    return /<think(?:ing)?>/i.test(text);
}
