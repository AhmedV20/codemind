import { Analysis, CacheEntry } from '@shared/types';
import { STORAGE_KEYS } from '@shared/constants';

/**
 * Cache manager for storing analysis results
 * Uses chrome.storage.local for persistence
 */
export class CacheManager {
    private memoryCache = new Map<string, CacheEntry<Analysis>>();

    /**
     * Get cached analysis for a repository
     */
    async get(owner: string, repo: string, branch: string): Promise<Analysis | null> {
        const key = this.buildKey(owner, repo, branch);

        // Check memory cache first
        const memEntry = this.memoryCache.get(key);
        if (memEntry && Date.now() < memEntry.expiresAt) {
            return memEntry.data;
        }

        // Check storage
        try {
            const storageKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
            const result = await chrome.storage.local.get(storageKey);
            const entry = result[storageKey] as CacheEntry<Analysis> | undefined;

            if (entry && Date.now() < entry.expiresAt) {
                // Refresh memory cache
                this.memoryCache.set(key, entry);
                return entry.data;
            }

            // Expired, clean up
            if (entry) {
                await this.delete(owner, repo, branch);
            }
        } catch (error) {
            console.error('[CacheManager] Error reading cache:', error);
        }

        return null;
    }

    /**
     * Check if cached analysis exists for a repository (without loading it)
     */
    async hasCache(owner: string, repo: string, branch: string): Promise<boolean> {
        const key = this.buildKey(owner, repo, branch);

        // Check memory cache first
        const memEntry = this.memoryCache.get(key);
        if (memEntry && Date.now() < memEntry.expiresAt) {
            return true;
        }

        // Check storage
        try {
            const storageKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
            const result = await chrome.storage.local.get(storageKey);
            const entry = result[storageKey] as CacheEntry<Analysis> | undefined;

            if (entry && Date.now() < entry.expiresAt) {
                return true;
            }
        } catch (error) {
            console.error('[CacheManager] Error checking cache:', error);
        }

        return false;
    }

    /**
     * Store analysis in cache
     */
    async set(
        owner: string,
        repo: string,
        branch: string,
        analysis: Analysis,
        ttlHours = 24
    ): Promise<void> {
        const key = this.buildKey(owner, repo, branch);
        const ttlMs = ttlHours * 60 * 60 * 1000;

        const entry: CacheEntry<Analysis> = {
            data: { ...analysis, fromCache: true },
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs,
        };

        // Store in memory
        this.memoryCache.set(key, entry);

        // Store in chrome.storage
        try {
            const storageKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
            await chrome.storage.local.set({ [storageKey]: entry });
        } catch (error) {
            console.error('[CacheManager] Error writing cache:', error);
        }
    }

    /**
     * Delete cached analysis
     */
    async delete(owner: string, repo: string, branch: string): Promise<void> {
        const key = this.buildKey(owner, repo, branch);
        this.memoryCache.delete(key);

        try {
            const storageKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
            await chrome.storage.local.remove(storageKey);
        } catch (error) {
            console.error('[CacheManager] Error deleting cache:', error);
        }
    }

    /**
     * Clear all cached analyses
     */
    async clearAll(): Promise<void> {
        this.memoryCache.clear();

        try {
            const allItems = await chrome.storage.local.get(null);
            const cacheKeys = Object.keys(allItems).filter(
                key => key.startsWith(STORAGE_KEYS.CACHE_PREFIX)
            );
            if (cacheKeys.length > 0) {
                await chrome.storage.local.remove(cacheKeys);
            }
        } catch (error) {
            console.error('[CacheManager] Error clearing cache:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ count: number; sizeBytes: number }> {
        try {
            const allItems = await chrome.storage.local.get(null);
            const cacheItems = Object.entries(allItems).filter(
                ([key]) => key.startsWith(STORAGE_KEYS.CACHE_PREFIX)
            );

            const sizeBytes = JSON.stringify(cacheItems).length;
            return { count: cacheItems.length, sizeBytes };
        } catch {
            return { count: 0, sizeBytes: 0 };
        }
    }

    private buildKey(owner: string, repo: string, branch: string): string {
        return `${owner}/${repo}:${branch}`;
    }
}

// Singleton instance
export const cacheManager = new CacheManager();
