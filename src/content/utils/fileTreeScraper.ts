/**
 * Scrape file tree from GitHub repository page DOM
 * This avoids API calls and rate limits
 */

export interface ScrapedFile {
    path: string;
    type: 'file' | 'directory';
    size?: string;
}

/**
 * Scrape visible file tree from GitHub page
 */
export function scrapeFileTree(): ScrapedFile[] {
    const files: ScrapedFile[] = [];

    try {
        // GitHub uses different selectors depending on UI version
        const selectors = [
            '.js-navigation-item',              // Classic GitHub
            '[data-testid="tree-row"]',         // New GitHub UI
            '.Box-row',                          // Alternative
        ];

        let rows: NodeListOf<Element> | null = null;

        for (const selector of selectors) {
            rows = document.querySelectorAll(selector);
            if (rows.length > 0) break;
        }

        if (!rows || rows.length === 0) {
            console.warn('[FileTreeScraper] No file rows found');
            return [];
        }

        rows.forEach(row => {
            try {
                // Get file link
                const link = row.querySelector('a[class*="Link"], a.js-navigation-open');
                if (!link) return;

                // Extract path from href
                const href = link.getAttribute('href');
                if (!href) return;

                // Detect if it's a directory or file
                const isDirectory = href.includes('/tree/') ||
                    row.querySelector('[aria-label*="Directory"]') !== null ||
                    row.querySelector('.octicon-file-directory') !== null;

                const isFile = href.includes('/blob/');

                if (!isDirectory && !isFile) return;

                // Extract path
                let path: string | null = null;

                if (isDirectory) {
                    const match = href.match(/\/tree\/[^/]+\/(.+)/);
                    path = match ? match[1] : null;
                } else if (isFile) {
                    const match = href.match(/\/blob\/[^/]+\/(.+)/);
                    path = match ? match[1] : null;
                }

                if (!path) return;

                // Get size if available (only for files)
                let size: string | undefined;
                if (isFile) {
                    const sizeEl = row.querySelector('[data-test-selector="file-size"], .flex-auto span');
                    size = sizeEl?.textContent?.trim();
                }

                files.push({
                    path: decodeURIComponent(path),
                    type: isDirectory ? 'directory' : 'file',
                    size,
                });
            } catch (error) {
                console.warn('[FileTreeScraper] Error parsing row:', error);
            }
        });

        console.log(`[FileTreeScraper] Scraped ${files.length} items from DOM`);
    } catch (error) {
        console.error('[FileTreeScraper] Error scraping file tree:', error);
    }

    return files;
}

/**
 * Convert size string to bytes (approximate)
 */
export function sizeToBytes(sizeStr: string): number {
    const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB|Bytes?)$/i);
    if (!match) return 2000; // Default

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
        case 'KB': return Math.round(value * 1024);
        case 'MB': return Math.round(value * 1024 * 1024);
        case 'GB': return Math.round(value * 1024 * 1024 * 1024);
        default: return Math.round(value);
    }
}
