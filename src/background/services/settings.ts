import { ExtensionSettings } from '@shared/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@shared/constants';

/**
 * Settings manager for extension preferences
 */
export class SettingsManager {
    private cachedSettings: ExtensionSettings | null = null;

    /**
     * Get current settings
     */
    async get(): Promise<ExtensionSettings> {
        if (this.cachedSettings) {
            return this.cachedSettings;
        }

        try {
            const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
            const stored = result[STORAGE_KEYS.SETTINGS];

            if (stored) {
                // Merge with defaults to ensure new settings are included
                this.cachedSettings = this.mergeWithDefaults(stored);
            } else {
                this.cachedSettings = { ...DEFAULT_SETTINGS };
            }

            return this.cachedSettings;
        } catch (error) {
            console.error('[SettingsManager] Error loading settings:', error);
            return { ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Save settings
     */
    async save(settings: Partial<ExtensionSettings>): Promise<void> {
        try {
            const current = await this.get();
            const updated = this.deepMerge(current, settings);

            await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: updated });
            this.cachedSettings = updated as ExtensionSettings;
        } catch (error) {
            console.error('[SettingsManager] Error saving settings:', error);
            throw error;
        }
    }

    /**
     * Reset to default settings
     */
    async reset(): Promise<void> {
        try {
            await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
            this.cachedSettings = { ...DEFAULT_SETTINGS };
        } catch (error) {
            console.error('[SettingsManager] Error resetting settings:', error);
            throw error;
        }
    }

    /**
     * Clear cached settings
     */
    clearCache(): void {
        this.cachedSettings = null;
    }

    private mergeWithDefaults(stored: Partial<ExtensionSettings>): ExtensionSettings {
        return this.deepMerge(DEFAULT_SETTINGS, stored) as ExtensionSettings;
    }

    private deepMerge(target: any, source: any): any {
        const result = { ...target };

        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }
}

// Singleton instance
export const settingsManager = new SettingsManager();

// Listen for settings changes
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes[STORAGE_KEYS.SETTINGS]) {
            settingsManager.clearCache();
        }
    });
}
