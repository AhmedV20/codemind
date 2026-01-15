import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Configuration
const INJECTION_TIMEOUT = 500;
const BUTTON_CONTAINER_ID = 'github-ai-analyzer-root';

// Check if we're on a valid GitHub repository page
function isRepositoryPage(): boolean {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length < 2) return false;

    // Exclude non-repo paths
    const excludedFirstParts = ['settings', 'orgs', 'marketplace', 'explore', 'notifications', 'new', 'login', 'signup'];
    if (excludedFirstParts.includes(pathParts[0])) return false;

    // Check if there's a repo nav (indicates we're on a repo page)
    const repoNav = document.querySelector('[data-testid="underline-nav-item"]') ||
        document.querySelector('.UnderlineNav-item') ||
        document.querySelector('.reponav-item');

    return !!repoNav;
}

// Extract repository information from the page URL
function extractRepoInfo(): { owner: string; repo: string; branch: string } | null {
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    if (pathParts.length < 2) return null;

    const owner = pathParts[0];
    const repo = pathParts[1];

    // Try to get branch from URL path (e.g., /owner/repo/tree/branch-name)
    let branch = 'main';

    if (pathParts[2] === 'tree' && pathParts[3]) {
        branch = pathParts[3];
    } else {
        // Try to get from DOM
        const branchSelector = document.querySelector('[data-hotkey="w"] span.Text-sc-17v1xeu-0, #branch-select-menu span');
        if (branchSelector) {
            branch = branchSelector.textContent?.trim() || 'main';
        }
    }

    return { owner, repo, branch };
}

// Find the repository navigation bar (where Code, Issues, Pull requests, Insights are)
function findRepoNavBar(): Element | null {
    // Try multiple selectors for the repo navigation
    const selectors = [
        // New GitHub UI - UnderlineNav (the main repo tabs)
        '.UnderlineNav-body',
        // Alternative selector for UnderlineNav
        'nav[aria-label="Repository"] ul',
        // Test ID based selector
        '[data-testid="underline-nav-item"]',
        // Repo nav container
        '.reponav',
        // Generic underline nav
        '.UnderlineNav nav',
        // The ul containing nav items
        '.UnderlineNav ul',
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            console.log('[CodeMind] Found nav bar:', selector);
            return element;
        }
    }

    // Fallback: Find the nav by looking for "Insights" or "Code" links
    const insightsLink = document.querySelector('a[data-tab-item="insights-tab"], a[href*="/pulse"]');
    if (insightsLink?.parentElement?.parentElement) {
        console.log('[CodeMind] Found nav via Insights link');
        return insightsLink.parentElement.parentElement;
    }

    console.warn('[CodeMind] Could not find repo navigation bar');
    return null;
}

// Detect GitHub theme
function getGitHubTheme(): 'light' | 'dark' {
    const colorMode = document.documentElement.getAttribute('data-color-mode');
    if (colorMode === 'dark') return 'dark';
    if (colorMode === 'light') return 'light';

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

let root: Root | null = null;

// Inject the analyze button
function injectAnalyzeButton(): void {
    // Prevent multiple injections
    if (document.getElementById(BUTTON_CONTAINER_ID)) {
        console.log('[CodeMind] Button already injected');
        return;
    }

    // Verify we're on a valid repo page
    if (!isRepositoryPage()) {
        console.log('[CodeMind] Not a repository page, skipping injection');
        return;
    }

    // Get repo info
    const repoInfo = extractRepoInfo();
    if (!repoInfo) {
        console.warn('[CodeMind] Could not extract repo info');
        return;
    }

    // Find the repo nav bar
    const navBar = findRepoNavBar();
    if (!navBar) {
        console.warn('[CodeMind] No nav bar found, retrying...');
        setTimeout(injectAnalyzeButton, 1000);
        return;
    }

    // Detect theme
    const theme = getGitHubTheme();

    // Create container that matches GitHub's nav item style
    const container = document.createElement('li');
    container.id = BUTTON_CONTAINER_ID;
    container.className = `github-ai-analyzer-root ${theme}`;
    container.style.cssText = `
        display: flex;
        align-items: center;
        margin-left: 8px;
        padding-left: 8px;
        border-left: 1px solid var(--borderColor-muted, rgba(208, 215, 222, 0.48));
    `;

    // Append to the end of nav (after Insights)
    navBar.appendChild(container);

    // Render React app
    root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App repoInfo={{ ...repoInfo, url: window.location.href }} />
        </React.StrictMode>
    );

    console.log('[CodeMind] Button injected in nav bar', repoInfo);
}

// Cleanup function
function cleanup(): void {
    const container = document.getElementById(BUTTON_CONTAINER_ID);
    if (container) {
        if (root) {
            root.unmount();
            root = null;
        }
        container.remove();
    }
}

// Initialize on page load
function initialize(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(injectAnalyzeButton, INJECTION_TIMEOUT);
        });
    } else {
        setTimeout(injectAnalyzeButton, INJECTION_TIMEOUT);
    }
}

// Handle GitHub's SPA navigation (Turbo/PJAX)
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[CodeMind] URL changed:', currentUrl);

        // Cleanup old button
        cleanup();

        // Re-inject on new page after a delay
        setTimeout(injectAnalyzeButton, INJECTION_TIMEOUT);
    }
});

// Also observe theme changes
const themeObserver = new MutationObserver(() => {
    const container = document.getElementById(BUTTON_CONTAINER_ID);
    if (container) {
        const theme = getGitHubTheme();
        container.className = `github-ai-analyzer-root ${theme}`;
    }
});

// Start observing
urlObserver.observe(document.body, {
    childList: true,
    subtree: true
});

themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-mode']
});

// Initialize
initialize();

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    urlObserver.disconnect();
    themeObserver.disconnect();
    cleanup();
});

console.log('[CodeMind] Content script loaded');
