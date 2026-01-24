import {
    RepositoryInfo,
    RepositoryMetadata,
    RepositoryData,
    RepositoryStructure,
    ReleaseInfo,
    KeyFile,
    FileTreeItem
} from '@shared/types';
import { API_ENDPOINTS } from '@shared/constants';

// Raw content URL - NOT rate limited like the API!
const RAW_CONTENT_URL = 'https://raw.githubusercontent.com';

// Key files to fetch for better analysis
const KEY_FILES_CONFIG = [
    // Package managers / Dependencies
    { path: 'package.json', type: 'config' as const, priority: 1 },
    { path: 'requirements.txt', type: 'config' as const, priority: 1 },
    { path: 'Cargo.toml', type: 'config' as const, priority: 1 },
    { path: 'go.mod', type: 'config' as const, priority: 1 },
    { path: 'pom.xml', type: 'config' as const, priority: 1 },
    { path: 'build.gradle', type: 'config' as const, priority: 1 },
    { path: 'Gemfile', type: 'config' as const, priority: 1 },
    { path: 'composer.json', type: 'config' as const, priority: 1 },
    { path: 'pyproject.toml', type: 'config' as const, priority: 1 },

    // Config files
    { path: 'tsconfig.json', type: 'config' as const, priority: 2 },
    { path: '.env.example', type: 'config' as const, priority: 2 },
    { path: 'docker-compose.yml', type: 'config' as const, priority: 2 },
    { path: 'Dockerfile', type: 'config' as const, priority: 2 },
    { path: 'vite.config.ts', type: 'config' as const, priority: 3 },
    { path: 'vite.config.js', type: 'config' as const, priority: 3 },
    { path: 'next.config.js', type: 'config' as const, priority: 3 },
    { path: 'webpack.config.js', type: 'config' as const, priority: 3 },

    // Entry points / Main files
    { path: 'src/index.ts', type: 'source' as const, priority: 2 },
    { path: 'src/index.tsx', type: 'source' as const, priority: 2 },
    { path: 'src/index.js', type: 'source' as const, priority: 2 },
    { path: 'src/main.ts', type: 'source' as const, priority: 2 },
    { path: 'src/main.tsx', type: 'source' as const, priority: 2 },
    { path: 'src/main.py', type: 'source' as const, priority: 2 },
    { path: 'src/app.ts', type: 'source' as const, priority: 2 },
    { path: 'src/app.tsx', type: 'source' as const, priority: 2 },
    { path: 'main.py', type: 'source' as const, priority: 2 },
    { path: 'main.go', type: 'source' as const, priority: 2 },
    { path: 'main.rs', type: 'source' as const, priority: 2 },
    { path: 'index.js', type: 'source' as const, priority: 2 },
    { path: 'index.ts', type: 'source' as const, priority: 2 },
    { path: 'app.py', type: 'source' as const, priority: 2 },
    { path: 'server.js', type: 'source' as const, priority: 2 },
    { path: 'server.ts', type: 'source' as const, priority: 2 },

    // Documentation
    { path: 'CONTRIBUTING.md', type: 'docs' as const, priority: 3 },
    { path: 'CHANGELOG.md', type: 'docs' as const, priority: 3 },
    { path: 'docs/README.md', type: 'docs' as const, priority: 3 },
    { path: 'API.md', type: 'docs' as const, priority: 3 },
];

/**
 * GitHub API client for fetching repository data
 */
export class GitHubClient {
    private baseUrl = API_ENDPOINTS.GITHUB_API;
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        console.log('[GitHubClient] Token set:', token ? `${token.substring(0, 8)}...` : 'null');
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    /**
     * Fetch complete repository data for analysis
     * Uses scraped metadata from DOM when available (no API calls!)
     */
    async fetchRepositoryData(info: RepositoryInfo): Promise<RepositoryData> {
        // Use scraped metadata if available (from DOM, no API needed!)
        // Otherwise fall back to API call (will be rate limited)
        let metadata: RepositoryMetadata;

        if (info.scrapedMetadata) {
            console.log('[GitHubClient] Using scraped metadata (no API call)');
            metadata = this.convertScrapedToMetadata(info, info.scrapedMetadata);
        } else {
            console.log('[GitHubClient] Falling back to API for metadata');
            metadata = await this.fetchMetadata(info.owner, info.repo);
        }

        // Fetch README using raw URL (not rate limited)
        const readme = await this.fetchReadme(info.owner, info.repo, info.branch);

        // Discover files by attempting to fetch known key files (no tree API needed!)
        const keyFiles = await this.discoverKeyFiles(info.owner, info.repo, info.branch);

        // Build a structure from discovered files
        const structure: RepositoryStructure = {
            tree: keyFiles.map(f => ({ path: f.path, type: 'blob' as const })),
            truncated: false,
        };

        // Skip releases API call to avoid rate limits
        const releases: ReleaseInfo[] = [];

        return {
            info,
            metadata,
            readme,
            structure,
            releases,
            keyFiles,
        };
    }

    /**
     * Convert scraped metadata to full RepositoryMetadata format
     */
    private convertScrapedToMetadata(info: RepositoryInfo, scraped: NonNullable<RepositoryInfo['scrapedMetadata']>): RepositoryMetadata {
        return {
            name: info.repo,
            fullName: `${info.owner}/${info.repo}`,
            description: scraped.description,
            stars: scraped.stars,
            forks: scraped.forks,
            watchers: scraped.watchers,
            language: scraped.language,
            topics: scraped.topics,
            license: scraped.license,
            createdAt: '', // Not available from DOM
            updatedAt: '', // Not available from DOM
            pushedAt: '', // Not available from DOM
            defaultBranch: info.branch,
            isArchived: scraped.isArchived,
            isFork: scraped.isFork,
        };
    }

    /**
     * Discover key files by attempting to fetch them directly (no tree API needed!)
     * Uses raw.githubusercontent.com which is NOT rate limited
     */
    async discoverKeyFiles(owner: string, repo: string, branch: string): Promise<KeyFile[]> {
        const keyFiles: KeyFile[] = [];

        // Fetch files in parallel batches, sorted by priority
        const sortedFiles = [...KEY_FILES_CONFIG].sort((a, b) => a.priority - b.priority);

        // Batch fetch to speed up discovery
        const batchSize = 5;
        for (let i = 0; i < sortedFiles.length && keyFiles.length < 10; i += batchSize) {
            const batch = sortedFiles.slice(i, i + batchSize);

            const results = await Promise.all(
                batch.map(async (fileConfig) => {
                    try {
                        const content = await this.fetchFileContent(owner, repo, branch, fileConfig.path);
                        if (content) {
                            // Limit content size to avoid token limits
                            const truncatedContent = content.length > 3000
                                ? content.slice(0, 3000) + '\n... [truncated]'
                                : content;

                            return {
                                path: fileConfig.path,
                                content: truncatedContent,
                                type: fileConfig.type,
                            } as KeyFile;
                        }
                    } catch {
                        // File doesn't exist, skip
                    }
                    return null;
                })
            );

            // Add successfully fetched files
            for (const result of results) {
                if (result && keyFiles.length < 10) {
                    keyFiles.push(result);
                }
            }
        }

        console.log(`[GitHubClient] Discovered ${keyFiles.length} key files`);
        return keyFiles;
    }

    /**
     * Fetch complete file tree using GitHub API
     * Works WITHOUT authentication for public repos (60/hour limit)
     * With token: 5000/hour limit
     */
    async fetchFullTree(owner: string, repo: string, branch: string): Promise<FileTreeItem[]> {
        try {
            const url = `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

            console.log('[GitHubClient] Fetching full tree from API');
            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('[GitHubClient] Repository or branch not found');
                } else if (response.status === 403) {
                    console.warn('[GitHubClient] Rate limit hit or access denied');
                }
                return [];
            }

            const data = await response.json();

            // Filter to only files (blob type), exclude directories
            const files = (data.tree || [])
                .filter((item: any) => item.type === 'blob')
                .map((item: any) => ({
                    path: item.path,
                    type: 'blob' as const,
                    size: item.size || 0,
                }));

            console.log(`[GitHubClient] Fetched ${files.length} files from tree API`);

            if (data.truncated) {
                console.warn('[GitHubClient] Tree was truncated (>100k files). Some files may be missing.');
            }

            return files;
        } catch (error) {
            console.error('[GitHubClient] Error fetching full tree:', error);
            return [];
        }
    }

    /**
     * Fetch repository metadata
     */
    async fetchMetadata(owner: string, repo: string): Promise<RepositoryMetadata> {
        const response = await fetch(
            `${this.baseUrl}/repos/${owner}/${repo}`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            // Try to get more details from the response body
            let errorDetails = '';
            try {
                const errorBody = await response.json();
                errorDetails = errorBody.message || '';
            } catch {
                errorDetails = response.statusText || `HTTP ${response.status}`;
            }

            console.error('[GitHubClient] API error:', response.status, errorDetails);

            if (response.status === 404) {
                throw new Error('Repository not found. It may be private or deleted.');
            }
            if (response.status === 403) {
                throw new Error(`API rate limit exceeded. ${errorDetails}`);
            }
            throw new Error(`Failed to fetch repository: ${errorDetails}`);
        }

        const data = await response.json();

        return {
            name: data.name,
            fullName: data.full_name,
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.watchers_count,
            language: data.language,
            topics: data.topics || [],
            license: data.license?.name || null,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            pushedAt: data.pushed_at,
            defaultBranch: data.default_branch,
            isArchived: data.archived,
            isFork: data.fork,
        };
    }

    /**
     * Fetch README content using raw.githubusercontent.com (bypasses API rate limits)
     */
    async fetchReadme(owner: string, repo: string, branch?: string): Promise<string | null> {
        // Try common README filenames using raw URL (NOT rate limited!)
        const readmeNames = ['README.md', 'readme.md', 'README.rst', 'README.txt', 'README'];
        const branchToUse = branch || 'main';

        for (const filename of readmeNames) {
            try {
                const rawUrl = `${RAW_CONTENT_URL}/${owner}/${repo}/${branchToUse}/${filename}`;
                const response = await fetch(rawUrl);

                if (response.ok) {
                    return await response.text();
                }
            } catch {
                // Try next filename
            }
        }

        // Fallback: try 'master' branch if 'main' didn't work
        if (branchToUse === 'main') {
            return this.fetchReadme(owner, repo, 'master');
        }

        return null;
    }

    /**
     * Fetch repository file structure
     */
    async fetchStructure(owner: string, repo: string, branch: string): Promise<RepositoryStructure> {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                return { tree: [], truncated: false };
            }

            const data = await response.json();

            return {
                tree: (data.tree || []).slice(0, 500).map((item: any) => ({
                    path: item.path,
                    type: item.type,
                    size: item.size,
                })),
                truncated: data.truncated || data.tree?.length > 500,
            };
        } catch {
            return { tree: [], truncated: false };
        }
    }

    /**
     * Fetch key files for deeper analysis
     */
    async fetchKeyFiles(
        owner: string,
        repo: string,
        branch: string,
        structure: RepositoryStructure
    ): Promise<KeyFile[]> {
        const existingPaths = new Set(structure.tree.map(item => item.path));

        // Filter to only files that exist in the repo
        const filesToFetch = KEY_FILES_CONFIG
            .filter(file => existingPaths.has(file.path))
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 8); // Limit to 8 files to avoid rate limits

        const keyFiles: KeyFile[] = [];

        for (const fileConfig of filesToFetch) {
            try {
                const content = await this.fetchFileContent(owner, repo, branch, fileConfig.path);
                if (content) {
                    // Limit content size to avoid token limits
                    const truncatedContent = content.length > 3000
                        ? content.slice(0, 3000) + '\n... [truncated]'
                        : content;

                    keyFiles.push({
                        path: fileConfig.path,
                        content: truncatedContent,
                        type: fileConfig.type,
                    });
                }
            } catch {
                // Skip files that fail to fetch
            }
        }

        return keyFiles;
    }

    /**
     * Fetch a single file's content using raw.githubusercontent.com
     * This bypasses API rate limits!
     */
    async fetchFileContent(owner: string, repo: string, branch: string, path: string): Promise<string | null> {
        try {
            // Use raw.githubusercontent.com - NOT rate limited!
            const rawUrl = `${RAW_CONTENT_URL}/${owner}/${repo}/${branch}/${path}`;
            const response = await fetch(rawUrl);

            if (!response.ok) {
                return null;
            }

            return await response.text();
        } catch {
            return null;
        }
    }

    /**
     * Fetch releases
     */
    async fetchReleases(owner: string, repo: string): Promise<ReleaseInfo[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${owner}/${repo}/releases?per_page=5`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                return [];
            }

            const data = await response.json();

            return data.map((release: any) => ({
                tagName: release.tag_name,
                name: release.name || release.tag_name,
                body: release.body || '',
                publishedAt: release.published_at,
                isPrerelease: release.prerelease,
                assets: (release.assets || []).map((asset: any) => ({
                    name: asset.name,
                    downloadUrl: asset.browser_download_url,
                    size: asset.size,
                    downloadCount: asset.download_count,
                })),
            }));
        } catch {
            return [];
        }
    }
}

// Singleton instance
export const githubClient = new GitHubClient();
