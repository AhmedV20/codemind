/**
 * DOM Scraper for extracting repository metadata from GitHub pages
 * This avoids using the GitHub API and its rate limits
 */

export interface ScrapedMetadata {
    description: string | null;
    stars: number;
    forks: number;
    watchers: number;
    topics: string[];
    language: string | null;
    license: string | null;
    isArchived: boolean;
    isFork: boolean;
}

/**
 * Safely parse a number from text, handling K/M suffixes
 */
function parseCount(text: string | null | undefined): number {
    if (!text) return 0;
    const cleaned = text.trim().toLowerCase();

    // Handle K (thousands) and M (millions) suffixes
    if (cleaned.endsWith('k')) {
        return Math.round(parseFloat(cleaned) * 1000);
    }
    if (cleaned.endsWith('m')) {
        return Math.round(parseFloat(cleaned) * 1000000);
    }

    // Remove commas and parse
    return parseInt(cleaned.replace(/,/g, ''), 10) || 0;
}

/**
 * Scrape repository metadata from the current GitHub page DOM
 */
export function scrapeRepositoryMetadata(): ScrapedMetadata {
    const metadata: ScrapedMetadata = {
        description: null,
        stars: 0,
        forks: 0,
        watchers: 0,
        topics: [],
        language: null,
        license: null,
        isArchived: false,
        isFork: false,
    };

    try {
        // Description - multiple selectors for different GitHub layouts
        const descriptionSelectors = [
            '.f4.my-3',
            '[data-testid="about-panel"] p',
            '.BorderGrid-cell p.f4',
            '.repository-content .f4',
            'meta[name="description"]',
        ];
        for (const selector of descriptionSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                metadata.description = el instanceof HTMLMetaElement
                    ? el.content
                    : el.textContent?.trim() || null;
                if (metadata.description) break;
            }
        }

        // Stars - look for star counter
        const starSelectors = [
            '#repo-stars-counter-star',
            'a[href$="/stargazers"] .Counter',
            'a[href$="/stargazers"] span.Counter',
            '[data-view-component="true"].Counter--primary',
        ];
        for (const selector of starSelectors) {
            const el = document.querySelector(selector);
            if (el?.textContent) {
                metadata.stars = parseCount(el.textContent);
                if (metadata.stars > 0) break;
            }
        }

        // Forks - look for fork counter
        const forkSelectors = [
            '#repo-network-counter',
            'a[href$="/forks"] .Counter',
            'a[href$="/network/members"] .Counter',
        ];
        for (const selector of forkSelectors) {
            const el = document.querySelector(selector);
            if (el?.textContent) {
                metadata.forks = parseCount(el.textContent);
                if (metadata.forks > 0) break;
            }
        }

        // Watchers - look for watch counter
        const watchSelectors = [
            'a[href$="/watchers"] .Counter',
            '#repo-watchers-counter',
        ];
        for (const selector of watchSelectors) {
            const el = document.querySelector(selector);
            if (el?.textContent) {
                metadata.watchers = parseCount(el.textContent);
                if (metadata.watchers > 0) break;
            }
        }

        // Topics - get all topic tags
        const topicElements = document.querySelectorAll('.topic-tag, a[data-octo-click="topic_click"]');
        metadata.topics = Array.from(topicElements)
            .map(el => el.textContent?.trim() || '')
            .filter(Boolean);

        // Language - from the language bar or about section
        const langSelectors = [
            '.BorderGrid-cell [data-ga-click*="language"]',
            '.repository-lang-stats-graph span[aria-label]',
            '.Layout-sidebar .h4.mb-3 + ul li span.color-fg-default',
        ];
        for (const selector of langSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                // Handle aria-label format like "Python 45.2%"
                const ariaLabel = el.getAttribute('aria-label');
                if (ariaLabel) {
                    metadata.language = ariaLabel.split(/\s+/)[0] || null;
                } else {
                    metadata.language = el.textContent?.trim().split(/\s+/)[0] || null;
                }
                if (metadata.language) break;
            }
        }

        // License - look for license info
        const licenseSelectors = [
            '.octicon-law + span',
            'a[href$="/blob/main/LICENSE"] span',
            'a[href$="/blob/master/LICENSE"] span',
            '.BorderGrid-cell .octicon-law',
        ];
        for (const selector of licenseSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                // If it's the octicon, get parent's text
                const parent = el.closest('a, div');
                metadata.license = parent?.textContent?.trim() || el.textContent?.trim() || null;
                if (metadata.license) break;
            }
        }

        // Check if archived
        metadata.isArchived = !!document.querySelector('.Label--attention, .flash-warn:has(.octicon-archive)');

        // Check if fork
        metadata.isFork = !!document.querySelector('.octicon-repo-forked, a[data-hovercard-type="repository"]:has(.octicon-repo-forked)');

        console.log('[CodeMind] Scraped metadata:', metadata);
    } catch (error) {
        console.error('[CodeMind] Error scraping metadata:', error);
    }

    return metadata;
}

/**
 * Get the default branch from DOM elements
 */
export function scrapeDefaultBranch(): string {
    const branchSelectors = [
        '[data-hotkey="w"] span.Text-sc-17v1xeu-0',
        '#branch-select-menu span.css-truncate-target',
        'summary[data-menu-button] span.css-truncate-target',
        '.branch-select-menu span.css-truncate-target',
    ];

    for (const selector of branchSelectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) {
            return el.textContent.trim();
        }
    }

    return 'main'; // Default fallback
}
