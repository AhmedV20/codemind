import { PRIORITY_WEIGHTS } from '@shared/constants';

interface FileItem {
    path: string;
    type: 'file' | 'directory';
    size?: number;
}

interface ScoredFile {
    path: string;
    size: number;
    score: number;
    category: 'docs' | 'config' | 'source' | 'test' | 'other';
}

/**
 * Priority rules for file selection
 */
const PRIORITY_RULES: Array<{
    pattern: RegExp;
    score: number;
    category: ScoredFile['category'];
}> = [
        // Tier 1: Critical Documentation (100 points)
        { pattern: /^readme\.md$/i, score: PRIORITY_WEIGHTS.README, category: 'docs' },

        // Tier 1: Package/Project Files (100 points)
        { pattern: /^package\.json$/, score: PRIORITY_WEIGHTS.PACKAGE_JSON, category: 'config' },
        { pattern: /^cargo\.toml$/, score: PRIORITY_WEIGHTS.PACKAGE_JSON, category: 'config' },
        { pattern: /^go\.mod$/, score: PRIORITY_WEIGHTS.PACKAGE_JSON, category: 'config' },
        { pattern: /^pyproject\.toml$/, score: PRIORITY_WEIGHTS.PACKAGE_JSON, category: 'config' },
        { pattern: /^composer\.json$/, score: PRIORITY_WEIGHTS.PACKAGE_JSON, category: 'config' },
        { pattern: /^gemfile$/i, score: PRIORITY_WEIGHTS.PACKAGE_JSON, category: 'config' },

        // Tier 2: Entry Points (90 points)
        { pattern: /^src\/(index|main|app)\.(ts|tsx|js|jsx|py|rs)$/, score: PRIORITY_WEIGHTS.ENTRY_POINT, category: 'source' },
        { pattern: /^(index|main|app)\.(ts|tsx|js|jsx|py|rs)$/, score: PRIORITY_WEIGHTS.ENTRY_POINT, category: 'source' },
        { pattern: /^src\/lib\.(ts|rs)$/, score: PRIORITY_WEIGHTS.ENTRY_POINT, category: 'source' },
        { pattern: /^lib\.rs$/, score: PRIORITY_WEIGHTS.ENTRY_POINT, category: 'source' },
        { pattern: /^mod\.rs$/, score: PRIORITY_WEIGHTS.ENTRY_POINT, category: 'source' },

        // Tier 3: Config Files (80 points)
        { pattern: /\.(config|conf)\.(ts|js|json|yaml|yml|toml)$/, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },
        { pattern: /^tsconfig\.json$/, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },
        { pattern: /^vite\.config\.(ts|js)$/, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },
        { pattern: /^webpack\.config\.(ts|js)$/, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },
        { pattern: /^next\.config\.(ts|js)$/, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },
        { pattern: /^dockerfile$/i, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },
        { pattern: /^docker-compose\.ya?ml$/i, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },
        { pattern: /^\.env\.example$/, score: PRIORITY_WEIGHTS.CONFIG, category: 'config' },

        // Tier 4: Core Source Files (70 points)
        { pattern: /^src\/.*\.(ts|tsx|js|jsx|py|rs|go)$/, score: PRIORITY_WEIGHTS.SOURCE, category: 'source' },
        { pattern: /^lib\/.*\.(ts|tsx|js|jsx|py|rs|go)$/, score: PRIORITY_WEIGHTS.SOURCE, category: 'source' },
        { pattern: /^app\/.*\.(ts|tsx|js|jsx|py)$/, score: PRIORITY_WEIGHTS.SOURCE, category: 'source' },

        // Tier 5: API/Routes (65 points)
        { pattern: /\/(api|routes|controllers|handlers)\/.*\.(ts|tsx|js|jsx|py)$/, score: PRIORITY_WEIGHTS.API_ROUTE, category: 'source' },

        // Tier 6: Components/Views (60 points)
        { pattern: /\/(components|views|pages|ui)\/.*\.(ts|tsx|js|jsx)$/, score: PRIORITY_WEIGHTS.COMPONENT, category: 'source' },

        // Tier 7: Documentation (50 points)
        { pattern: /^docs\/.*\.md$/, score: PRIORITY_WEIGHTS.DOCS, category: 'docs' },
        { pattern: /^(contributing|changelog|api)\.md$/i, score: PRIORITY_WEIGHTS.DOCS, category: 'docs' },
        { pattern: /^\.github\/.*\.md$/, score: PRIORITY_WEIGHTS.DOCS, category: 'docs' },

        // Tier 8: Tests (20 points) - low priority
        { pattern: /\.(test|spec)\.(ts|tsx|js|jsx|py)$/, score: PRIORITY_WEIGHTS.TEST, category: 'test' },
        { pattern: /^tests?\//, score: PRIORITY_WEIGHTS.TEST, category: 'test' },
        { pattern: /^__tests__\//, score: PRIORITY_WEIGHTS.TEST, category: 'test' },

        // Default (10 points)
        { pattern: /.*/, score: PRIORITY_WEIGHTS.OTHER, category: 'other' },
    ];

/**
 * Files to ALWAYS exclude
 */
const EXCLUDE_PATTERNS = [
    /node_modules\//,
    /\.git\//,
    /\.github\/workflows\//,
    /dist\//,
    /build\//,
    /out\//,
    /target\//,
    /\.next\//,
    /\.nuxt\//,
    /\.cache\//,
    /coverage\//,
    /\.min\.(js|css)$/,
    /\.map$/,
    /-lock\.(json|yaml)$/,
    /^package-lock\.json$/,
    /^yarn\.lock$/,
    /^pnpm-lock\.yaml$/,
    /^bun\.lockb$/,
    /^composer\.lock$/,
    /^Cargo\.lock$/,
    /^Gemfile\.lock$/,
    /\.(png|jpg|jpeg|gif|ico|svg|webp|bmp|tiff)$/i,
    /\.(woff|woff2|ttf|eot|otf)$/i,
    /\.(mp3|mp4|webm|ogg|wav|flac)$/i,
    /\.(zip|tar|gz|rar|7z)$/i,
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,
    /\.exe$/i,
    /\.dll$/i,
];

/**
 * Prioritize and score files for analysis
 */
export function prioritizeFiles(
    files: FileItem[],
    config: { priorityThreshold: number }
): ScoredFile[] {
    // Filter out excluded files and directories
    const filtered = files.filter(f => {
        if (f.type === 'directory') return false;
        return !EXCLUDE_PATTERNS.some(pattern => pattern.test(f.path));
    });

    // Score each file
    const scored: ScoredFile[] = filtered.map(file => {
        // Find matching rule (first match wins)
        const rule = PRIORITY_RULES.find(r => r.pattern.test(file.path));

        return {
            path: file.path,
            size: file.size || 2000, // Default size if unknown
            score: rule?.score || PRIORITY_WEIGHTS.OTHER,
            category: rule?.category || 'other',
        };
    });

    // Filter by threshold and sort by score (highest first)
    return scored
        .filter(f => f.score >= config.priorityThreshold)
        .sort((a, b) => {
            // Sort by score first, then by category priority
            if (b.score !== a.score) return b.score - a.score;

            // If same score, prefer certain categories
            const categoryOrder = ['docs', 'config', 'source', 'test', 'other'];
            return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        });
}
