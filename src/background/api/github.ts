import {
    RepositoryInfo,
    RepositoryMetadata,
    RepositoryData,
    RepositoryStructure,
    ReleaseInfo,
    KeyFile
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
     */
    async fetchRepositoryData(info: RepositoryInfo): Promise<RepositoryData> {
        const [metadata, readme, structure, releases] = await Promise.all([
            this.fetchMetadata(info.owner, info.repo),
            this.fetchReadme(info.owner, info.repo),
            this.fetchStructure(info.owner, info.repo, info.branch),
            this.fetchReleases(info.owner, info.repo),
        ]);

        // Fetch key files based on what exists in the structure
        const keyFiles = await this.fetchKeyFiles(info.owner, info.repo, info.branch, structure);

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
