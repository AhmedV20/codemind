/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // Disable Preflight to prevent CSS leaking into GitHub's page
    // Preflight resets list-style, margins, etc. which breaks GitHub's ol/ul/badges
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            colors: {
                // GitHub Light Theme Colors
                github: {
                    // Backgrounds
                    'canvas-default': '#ffffff',
                    'canvas-subtle': '#f6f8fa',
                    'canvas-inset': '#eff2f5',
                    // Borders
                    'border-default': 'rgba(27, 31, 36, 0.15)',
                    'border-muted': 'rgba(27, 31, 36, 0.1)',
                    // Text
                    'fg-default': '#1f2328',
                    'fg-muted': '#656d76',
                    'fg-subtle': '#6e7781',
                    // Accent
                    'accent-fg': '#0969da',
                    'accent-emphasis': '#0969da',
                    'accent-muted': 'rgba(9, 105, 218, 0.4)',
                    'accent-subtle': '#ddf4ff',
                    // Success
                    'success-fg': '#1a7f37',
                    'success-emphasis': '#1f883d',
                    // Danger
                    'danger-fg': '#d1242f',
                    'danger-emphasis': '#cf222e',
                    // Warning
                    'attention-fg': '#9a6700',
                    'attention-emphasis': '#bf8700',
                },
                // GitHub Dark Theme Colors
                'github-dark': {
                    // Backgrounds
                    'canvas-default': '#0d1117',
                    'canvas-subtle': '#161b22',
                    'canvas-inset': '#010409',
                    // Borders
                    'border-default': 'rgba(240, 246, 252, 0.1)',
                    'border-muted': 'rgba(240, 246, 252, 0.05)',
                    // Text
                    'fg-default': '#e6edf3',
                    'fg-muted': '#8d96a0',
                    'fg-subtle': '#6e7681',
                    // Accent
                    'accent-fg': '#4493f8',
                    'accent-emphasis': '#1f6feb',
                    'accent-muted': 'rgba(56, 139, 253, 0.4)',
                    'accent-subtle': 'rgba(56, 139, 253, 0.1)',
                    // Success
                    'success-fg': '#3fb950',
                    'success-emphasis': '#238636',
                    // Danger
                    'danger-fg': '#f85149',
                    'danger-emphasis': '#da3633',
                    // Warning
                    'attention-fg': '#d29922',
                    'attention-emphasis': '#9e6a03',
                },
            },
            fontFamily: {
                github: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji'],
                mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
            },
            fontSize: {
                'xs': ['12px', { lineHeight: '18px' }],
                'sm': ['14px', { lineHeight: '20px' }],
                'base': ['16px', { lineHeight: '24px' }],
            },
            spacing: {
                '4.5': '18px',
                '7': '28px',
            },
            borderRadius: {
                'github': '6px',
                'github-lg': '12px',
            },
            boxShadow: {
                'github': '0 1px 0 rgba(27, 31, 36, 0.04)',
                'github-medium': '0 3px 6px rgba(140, 149, 159, 0.15)',
                'github-large': '0 8px 24px rgba(140, 149, 159, 0.2)',
                'github-overlay': '0 1px 3px rgba(27, 31, 36, 0.12), 0 8px 24px rgba(66, 74, 83, 0.12)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
        },
    },
    plugins: [],
    // Prefix to avoid conflicts with GitHub's styles
    prefix: 'gai-',
};
